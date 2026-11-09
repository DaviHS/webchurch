"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, CalendarCheck, Check, ChevronDown, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LoadingState } from "@/components/ui/loading-state";
import { Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/page-header";
import { useConfirm } from "@/components/confirm-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { getBook } from "@/lib/bible";
import {
  chaptersForDay,
  currentDay,
  describeChapters,
  localToday,
  READING_PLANS,
  type ReadingPlan,
} from "@/lib/bible-plans";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

interface PlanProgress {
  planKey: string;
  startedOn: string;
  completedDays: number[];
}

function ChapterLinks({ plan, day }: { plan: ReadingPlan; day: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chaptersForDay(plan, day).map(({ bookId, chapter }) => {
        const book = getBook(bookId);
        return (
          <Button key={`${bookId}:${chapter}`} asChild size="sm" variant="outline">
            <Link href={`/app/bible?b=${bookId}&c=${chapter}`}>
              {book?.abbrev ?? bookId} {chapter}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function ActivePlan({ plan, progress, today }: { plan: ReadingPlan; progress: PlanProgress; today: string }) {
  const utils = api.useUtils();
  const confirm = useConfirm();
  const done = new Set(progress.completedDays);
  const dueDay = currentDay(plan, progress.startedOn, today);
  const finished = done.size >= plan.days;

  const refresh = () => utils.bible.planState.invalidate();
  const setDay = api.bible.setPlanDay.useMutation(mutationFeedback({ error: "Erro ao salvar a leitura", onSuccess: refresh }));
  const leave = api.bible.leavePlan.useMutation(
    mutationFeedback({ success: "Plano reiniciado", error: "Erro ao reiniciar o plano", onSuccess: refresh }),
  );

  const pendingDays = Array.from({ length: dueDay }, (_, index) => index + 1).filter((day) => !done.has(day));
  const overdue = pendingDays.filter((day) => day < dueDay);
  const todayDone = dueDay > 0 && done.has(dueDay);

  const toggle = (day: number, value: boolean) => setDay.mutate({ planKey: plan.key, day, done: value });

  const restart = async () => {
    const confirmed = await confirm({
      title: "Recomeçar o plano",
      description: `Seu andamento em "${plan.label}" será apagado e o plano volta ao dia 1, a partir de hoje.`,
      confirmLabel: "Recomeçar",
      destructive: true,
    });
    if (confirmed) leave.mutate({ planKey: plan.key });
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{plan.label}</CardTitle>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => void restart()} title="Recomeçar o plano" aria-label="Recomeçar o plano">
            <RotateCcw />
          </Button>
        </div>
        <Progress value={(done.size / plan.days) * 100} aria-label="Andamento do plano" />
        <p className="text-sm text-muted-foreground">
          {done.size} de {plan.days} dias lidos
          {!finished && dueDay > 0 && ` · hoje é o dia ${dueDay}`}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {finished ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <Check className="size-4" /> Plano concluído. Parabéns!
          </p>
        ) : dueDay === 0 ? (
          <p className="text-sm text-muted-foreground">O plano começa em {progress.startedOn}.</p>
        ) : (
          <div className={cn("space-y-3 rounded-lg border p-3", todayDone && "border-success/40 bg-success/5")}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leitura de hoje · dia {dueDay}</p>
              <p className="text-base font-semibold">{describeChapters(chaptersForDay(plan, dueDay))}</p>
            </div>
            <ChapterLinks plan={plan} day={dueDay} />
            <Button
              type="button"
              variant={todayDone ? "outline" : "default"}
              className="w-full sm:w-auto"
              disabled={setDay.isPending}
              onClick={() => toggle(dueDay, !todayDone)}
            >
              <Check className="mr-1" /> {todayDone ? "Lido (desfazer)" : "Marcar como lido"}
            </Button>
          </div>
        )}

        {overdue.length > 0 && (
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="group flex w-full items-center gap-2 p-3 text-left text-sm font-semibold">
              <span className="flex-1">
                {overdue.length} {overdue.length === 1 ? "dia atrasado" : "dias atrasados"}
              </span>
              <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 px-3 pb-3">
                {overdue.map((day) => (
                  <li key={day} className="flex items-center gap-2 rounded-md border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Dia {day}</p>
                      <p className="truncate text-sm font-medium">{describeChapters(chaptersForDay(plan, day))}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled={setDay.isPending} onClick={() => toggle(day, true)}>
                      <Check className="mr-1" /> Li
                    </Button>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function PlanOffer({ plan, today }: { plan: ReadingPlan; today: string }) {
  const utils = api.useUtils();
  const start = api.bible.startPlan.useMutation(
    mutationFeedback({
      success: "Plano iniciado",
      error: "Erro ao iniciar o plano",
      onSuccess: () => utils.bible.planState.invalidate(),
    }),
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">{plan.label}</p>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
        <Button type="button" className="w-full sm:w-auto" disabled={start.isPending} onClick={() => start.mutate({ planKey: plan.key, today })}>
          <CalendarCheck className="mr-1" /> Começar hoje
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ReadingPlanPage() {
  const [today] = useState(() => localToday());
  const { data, isLoading, error, refetch } = api.bible.planState.useQuery();

  const byKey = new Map((data ?? []).map((item) => [item.planKey, item]));
  const active = READING_PLANS.filter((plan) => byKey.has(plan.key));
  const available = READING_PLANS.filter((plan) => !byKey.has(plan.key));

  return (
    <PageContainer>
      <PageHeader
        title="Plano de leitura"
        icon={BookOpenCheck}
        description="Leia a Bíblia um pouco por dia e acompanhe seu andamento. Só você vê o seu progresso."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/bible">
              <ChevronLeft className="mr-1" /> Voltar à Bíblia
            </Link>
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorDisplay message={error.message} onRetry={() => void refetch()} />}

      {data && (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {active.map((plan) => {
                const progress = byKey.get(plan.key);
                return progress ? <ActivePlan key={plan.key} plan={plan} progress={progress} today={today} /> : null;
              })}
            </div>
          )}

          {available.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {active.length > 0 ? "Outros planos" : "Escolha um plano"}
              </h2>
              <div className="grid gap-3">
                {available.map((plan) => (
                  <PlanOffer key={plan.key} plan={plan} today={today} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}

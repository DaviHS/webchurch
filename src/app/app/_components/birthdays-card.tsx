"use client";

import { useState } from "react";
import { Cake, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { StatCard } from "@/components/stat-card";
import { whatsappNumber } from "@/lib/birthdays";
import { localToday } from "@/lib/bible-plans";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { api } from "@/trpc/react";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const pad = (value: number) => String(value).padStart(2, "0");

function whenLabel(daysFromToday: number) {
  if (daysFromToday === 0) return "Hoje";
  if (daysFromToday === 1) return "Amanhã";
  if (daysFromToday < 0) return "Já passou";
  return `Em ${daysFromToday} dias`;
}

/** Quadro "Aniversariantes" do Início: mostra quantos fazem aniversário neste mês e, ao tocar, abre a lista. Só para quem gerencia os membros. */
export function BirthdaysStatCard() {
  const canSee = usePermissions().can("members.manage");
  const [open, setOpen] = useState(false);
  const [today] = useState(() => localToday());
  const { data, isLoading } = api.member.birthdaysOfMonth.useQuery({ today }, { enabled: canSee, staleTime: 5 * 60_000 });

  if (!canSee) return null;

  const monthName = MONTHS[Number(today.slice(5, 7)) - 1] ?? "";

  return (
    <>
      <StatCard
        title="Aniversariantes"
        value={data?.length ?? 0}
        description={`Em ${monthName}`}
        icon={Cake}
        isLoading={isLoading}
        onClick={() => setOpen(true)}
      />

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent size="md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Aniversariantes de {monthName}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Membros ativos, por dia do mês.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="pb-4">
            {data && data.length > 0 ? (
              <ul className="space-y-2">
                {data.map((person) => {
                  const passed = person.daysFromToday < 0;
                  const number = passed ? null : whatsappNumber(person.whatsapp);
                  const message = `Feliz aniversário, ${person.firstName}! Que Deus abençoe muito a sua vida. Com carinho, Igreja Central.`;
                  return (
                    <li key={person.id} className={cn("flex items-center gap-3 rounded-lg border p-3", passed && "opacity-60")}>
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="text-lg font-bold leading-none tabular-nums">{pad(person.day)}</span>
                        <span className="text-[11px] uppercase tabular-nums">/{pad(Number(today.slice(5, 7)))}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold sm:text-base">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className={cn("text-xs sm:text-sm", person.daysFromToday === 0 ? "font-medium text-primary" : "text-muted-foreground")}>
                          {whenLabel(person.daysFromToday)} · {passed ? "fez" : "faz"} {person.turning} anos
                        </p>
                      </div>
                      {number && (
                        <Button asChild variant="outline" size="icon" title="Dar os parabéns no WhatsApp" aria-label={`Dar os parabéns a ${person.firstName} no WhatsApp`}>
                          <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle />
                          </a>
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={Cake} title={`Ninguém faz aniversário em ${monthName}`} />
            )}
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

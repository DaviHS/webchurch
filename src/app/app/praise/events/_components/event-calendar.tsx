"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingState } from "@/components/ui/loading-state";
import { formatEventWhen } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { EventData } from "@/types";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MAX_DOTS = 3;

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

/** Calendário do mês: dias com evento ganham marcas; tocar no dia lista os eventos dele logo abaixo. */
export function EventCalendar({
  onViewDetails,
  onCreateOnDate,
}: {
  onViewDetails: (event: EventData) => void;
  /** Quando informado (e a pessoa pode editar), mostra "Novo evento neste dia". */
  onCreateOnDate?: (date: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());

  const { data, isLoading, error, refetch } = api.event.list.useQuery(
    { startDate: startOfMonth(month), endDate: endOfMonth(month), limit: 100 },
    { placeholderData: (previous) => previous, staleTime: 30_000 },
  );

  const events = (data?.events ?? []).filter((event) => event.type !== "template");
  const byDay = new Map<string, EventData[]>();
  for (const event of events) {
    const key = dayKey(new Date(event.date));
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }

  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  const dayEvents = (byDay.get(dayKey(selected)) ?? []).sort(
    (a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "") || new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const goToMonth = (target: Date) => {
    setMonth(startOfMonth(target));
    setSelected(isSameMonth(target, new Date()) ? new Date() : startOfMonth(target));
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => goToMonth(addMonths(month, -1))} aria-label="Mês anterior">
              <ChevronLeft />
            </Button>
            <div className="flex min-w-0 flex-col items-center">
              <h2 className="truncate text-base font-semibold capitalize">{format(month, "MMMM 'de' yyyy", { locale: ptBR })}</h2>
              {!isSameMonth(month, new Date()) && (
                <button type="button" onClick={() => goToMonth(new Date())} className="text-xs font-medium text-primary hover:underline">
                  Voltar para hoje
                </button>
              )}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => goToMonth(addMonths(month, 1))} aria-label="Próximo mês">
              <ChevronRight />
            </Button>
          </div>

          {error && !data ? (
            <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />
          ) : isLoading && !data ? (
            <LoadingState />
          ) : (
            <div role="grid" aria-label="Calendário de eventos" aria-busy={isLoading}>
              <div role="row" className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((label, index) => (
                  <span key={index} role="columnheader">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const list = byDay.get(dayKey(day)) ?? [];
                  const inMonth = isSameMonth(day, month);
                  const active = isSameDay(day, selected);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      role="gridcell"
                      aria-selected={active}
                      aria-label={`${format(day, "d 'de' MMMM", { locale: ptBR })}${list.length > 0 ? `, ${list.length} ${list.length === 1 ? "evento" : "eventos"}` : ""}`}
                      onClick={() => setSelected(day)}
                      className={cn(
                        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md border text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                        !inMonth && "text-muted-foreground/50",
                        isToday(day) && !active && "border-primary/60 font-semibold",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:bg-accent",
                      )}
                    >
                      <span className="leading-none">{format(day, "d")}</span>
                      <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                        {list.slice(0, MAX_DOTS).map((event) => (
                          <span key={event.id} className={cn("size-1.5 rounded-full", active ? "bg-primary-foreground" : "bg-primary")} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-2" aria-live="polite">
        <h3 className="text-sm font-semibold capitalize text-muted-foreground">{format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
        {dayEvents.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            Nenhum evento neste dia.
          </p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onViewDetails(event)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{event.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>{formatEventWhen(event.date, event.startTime)}</span>
                      <span className="flex items-center gap-1">
                        <Music className="size-3" />
                        {event.songCount + event.passageCount > 0 ? `${event.songCount} ${event.songCount === 1 ? "música" : "músicas"}` : "Sem repertório"}
                      </span>
                    </span>
                  </span>
                  <Badge variant={eventTypeBadge(event.type)} className="shrink-0">
                    {eventTypeLabel(event.type)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
        {onCreateOnDate && (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onCreateOnDate(selected)}>
            <Plus />
            Novo evento neste dia
          </Button>
        )}
      </section>
    </div>
  );
}

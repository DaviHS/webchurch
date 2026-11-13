"use client";

import { useState } from "react";
import Link from "next/link";
import { startOfDay } from "date-fns";
import { Calendar, CalendarClock, ChevronRight, MapPin, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventWhen } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";

const LIMIT = 4;

export function UpcomingEventsCard() {
  const [today] = useState(() => startOfDay(new Date()));
  const { data, isLoading } = api.event.list.useQuery({ scope: "upcoming", limit: LIMIT, today }, { staleTime: 60_000 });
  const upcoming = data?.events ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Próximos eventos</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/praise/events">
            Ver todos
            <ChevronRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : upcoming.length > 0 ? (
          <ul className="space-y-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href="/app/praise/events"
                  className="block space-y-1.5 rounded-md border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold sm:text-base">{event.title}</span>
                    <Badge variant={eventTypeBadge(event.type)} className="shrink-0 px-1.5 py-0 text-[11px]">
                      {eventTypeLabel(event.type)}
                    </Badge>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5 shrink-0" />
                      {formatEventWhen(event.date, event.startTime)}
                    </span>
                    {event.location && (
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Music className="size-3.5 shrink-0" />
                      {event.songCount > 0 ? (
                        `${event.songCount} ${event.songCount === 1 ? "música" : "músicas"}`
                      ) : (
                        <span className="font-medium text-warning">Repertório vazio</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarClock} title="Nenhum evento agendado" description="Os próximos eventos aparecerão aqui." />
        )}
      </CardContent>
    </Card>
  );
}

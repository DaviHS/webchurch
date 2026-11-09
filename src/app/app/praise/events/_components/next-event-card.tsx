"use client";

import Link from "next/link";
import { Calendar, Info, MapPin, Music, Projector } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEventWhen } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";
import type { EventData } from "@/types";

const PREVIEW = 5;

/** O próximo evento em destaque: quando é, o repertório em prévia e os atalhos para apresentar ou abrir. */
export function NextEventCard({ event, onViewDetails }: { event: EventData; onViewDetails: (event: EventData) => void }) {
  const { data } = api.event.getById.useQuery(event.id, { staleTime: 30_000 });
  const songs = [...(data?.songs ?? [])].sort((a, b) => a.order - b.order);
  const hasSongs = event.songCount > 0;
  // Apresentar só faz sentido com música ou passagem bíblica no evento.
  const hasContent = hasSongs || event.passageCount > 0;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próximo evento</p>
          <Badge variant={eventTypeBadge(event.type)} className="shrink-0">
            {eventTypeLabel(event.type)}
          </Badge>
        </div>

        <div className="space-y-1">
          <h2 className="break-words text-xl font-bold leading-tight">{event.title}</h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-4 shrink-0" />
              {formatEventWhen(event.date, event.startTime)}
            </span>
            {event.location && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="size-4 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </p>
        </div>

        {hasSongs ? (
          <ol className="space-y-1 text-sm">
            {songs.slice(0, PREVIEW).map((item, index) => (
              <li key={item.id} className="flex gap-2">
                <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">{index + 1}.</span>
                <span className="min-w-0 truncate">{item.song?.title ?? "Música removida"}</span>
                {item.song && !item.song.lyrics?.trim() && <span className="shrink-0 text-xs font-medium text-warning">sem letra</span>}
              </li>
            ))}
            {event.songCount > PREVIEW && (
              <li className="pl-7 text-xs text-muted-foreground">+ {event.songCount - PREVIEW} músicas</li>
            )}
          </ol>
        ) : hasContent ? (
          <p className="text-sm text-muted-foreground">
            {event.passageCount} {event.passageCount === 1 ? "passagem bíblica" : "passagens bíblicas"}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-medium text-warning">
            <Music className="size-4" />
            Repertório ainda vazio
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {hasContent && (
            <Button asChild className="sm:flex-1">
              <Link href={`/presentation/control?event=${event.id}`}>
                <Projector />
                Apresentar
              </Link>
            </Button>
          )}
          <Button type="button" variant={hasContent ? "outline" : "default"} className="sm:flex-1" onClick={() => onViewDetails(event)}>
            <Info />
            {hasContent ? "Detalhes" : "Montar repertório"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { Calendar, Copy, Edit, Info, MapPin, Music, Printer, Projector, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { formatEventWhen } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";
import type { EventData } from "@/types";

const PREVIEW = 5;

interface NextEventCardProps {
  event: EventData;
  onViewDetails: (event: EventData) => void;
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onDuplicate: (event: EventData) => void;
  onPrint: (event: EventData) => void;
}

export function NextEventCard({ event, onViewDetails, onEdit, onDelete, onDuplicate, onPrint }: NextEventCardProps) {
  const canEdit = usePermissions().can("events.edit");
  const { data } = api.event.getById.useQuery(event.id, { staleTime: 30_000 });
  const songs = [...(data?.songs ?? [])].sort((a, b) => a.order - b.order);
  const hasSongs = event.songCount > 0;
  const hasContent = hasSongs || event.passageCount > 0;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próximo evento</p>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={eventTypeBadge(event.type)}>{eventTypeLabel(event.type)}</Badge>
            <RowActionsMenu
              label={`Ações do evento ${event.title}`}
              actions={[
                { label: "Editar", icon: Edit, onSelect: () => onEdit(event), hidden: !canEdit },
                { label: "Imprimir repertório", icon: Printer, onSelect: () => onPrint(event), hidden: !hasContent },
                { label: "Duplicar para o próximo dia livre", icon: Copy, onSelect: () => onDuplicate(event), hidden: !canEdit },
                { label: "Excluir", icon: Trash2, onSelect: () => onDelete(event), destructive: true, hidden: !canEdit },
              ]}
            />
          </div>
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

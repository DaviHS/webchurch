"use client";

import Link from "next/link";
import { Calendar, Copy, Edit, Info, MapPin, Music, Printer, Projector, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { formatEventWhen } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import type { EventData } from "@/types";

interface EventCardProps {
  event: EventData;
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onViewDetails: (event: EventData) => void;
  onDuplicate: (event: EventData) => void;
  onPrint: (event: EventData) => void;
  /** Evento que já passou: não faz sentido avisar que o repertório está vazio. */
  isPast?: boolean;
}

function contentSummary(songs: number, passages: number): string {
  const parts: string[] = [];
  if (songs > 0) parts.push(`${songs} ${songs === 1 ? "música" : "músicas"}`);
  if (passages > 0) parts.push(`${passages} ${passages === 1 ? "passagem" : "passagens"}`);
  return parts.join(" · ");
}

export function EventCard({ event, onEdit, onDelete, onViewDetails, onDuplicate, onPrint, isPast = false }: EventCardProps) {
  const canEdit = usePermissions().can("events.edit");
  // A apresentação usa as músicas e as passagens bíblicas do evento; sem nenhuma das duas, não há o que apresentar.
  const hasContent = event.songCount + event.passageCount > 0;

  return (
    <Card className="flex h-full flex-col transition-shadow [@media(hover:hover)]:hover:shadow-md">
      <div className="flex items-start gap-1 p-1 pr-2">
        <button
          type="button"
          onClick={() => onViewDetails(event)}
          aria-label={`Ver detalhes de ${event.title}`}
          className="min-w-0 flex-1 space-y-1.5 rounded-md p-3 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            <span title={event.title} className="min-w-0 truncate text-base font-semibold leading-tight">
              {event.title}
            </span>
            <Badge variant={eventTypeBadge(event.type)} className="shrink-0 px-1.5 py-0 text-[11px]">
              {eventTypeLabel(event.type)}
            </Badge>
          </span>

          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
          </span>

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Music className="size-3.5 shrink-0" />
            {hasContent ? (
              <>
                {contentSummary(event.songCount, event.passageCount)}
                {event.noLyricsCount > 0 && <span className="font-medium text-warning"> · {event.noLyricsCount} sem letra</span>}
              </>
            ) : isPast ? (
              "Sem repertório"
            ) : (
              <span className="font-medium text-warning">Repertório vazio</span>
            )}
          </span>
        </button>

        <RowActionsMenu
          label={`Ações do evento ${event.title}`}
          className="mt-1.5 shrink-0"
          actions={[
            { label: "Editar", icon: Edit, onSelect: () => onEdit(event), hidden: !canEdit },
            { label: "Detalhes", icon: Info, onSelect: () => onViewDetails(event) },
            { label: "Imprimir repertório", icon: Printer, onSelect: () => onPrint(event), hidden: !hasContent },
            { label: "Duplicar para o próximo dia livre", icon: Copy, onSelect: () => onDuplicate(event), hidden: !canEdit },
            { label: "Excluir", icon: Trash2, onSelect: () => onDelete(event), destructive: true, hidden: !canEdit },
          ]}
        />
      </div>

      {hasContent && (
        <div className="mt-auto border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href={`/presentation/control?event=${event.id}`}>
              <Projector />
              Apresentar
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
}

"use client";

import type { KeyboardEvent } from "react";
import { Calendar, Edit, Info, MapPin, Projector, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import type { EventData } from "@/types";

interface EventCardProps {
  event: EventData;
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onViewDetails: (event: EventData) => void;
}

export function EventCard({ event, onEdit, onDelete, onViewDetails }: EventCardProps) {
  const canEdit = usePermissions().can("events.edit");
  const handleKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.target !== keyboardEvent.currentTarget) return;
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      onViewDetails(event);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${event.title}`}
      onClick={() => onViewDetails(event)}
      onKeyDown={handleKeyDown}
      className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:bg-muted/50"
    >
      <CardHeader className="gap-1 p-3 pl-4">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CardTitle title={event.title} className="min-w-0 truncate text-base leading-tight">{event.title}</CardTitle>
            <Badge variant={eventTypeBadge(event.type)} className="shrink-0 px-1.5 py-0 text-[11px]">
              {eventTypeLabel(event.type)}
            </Badge>
          </div>
          <RowActionsMenu
            label={`Ações do evento ${event.title}`}
            actions={[
              { label: "Editar", icon: Edit, onSelect: () => onEdit(event), hidden: !canEdit },
              { label: "Apresentar", icon: Projector, href: `/presentation/control?event=${event.id}` },
              { label: "Detalhes", icon: Info, onSelect: () => onViewDetails(event) },
              { label: "Excluir", icon: Trash2, onSelect: () => onDelete(event), destructive: true, hidden: !canEdit },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3 shrink-0" />
            {formatDate(event.date)}
          </span>
          {event.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { EventActions } from "./event-actions";
import { eventTypeLabels, getEventTypeBadgeVariant } from "./event-type";
import { formatDate } from "@/lib/formatters";
import type { EventData } from "@/types";

interface EventCardProps {
  event: EventData;
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onViewDetails: (event: EventData) => void;
}

export function EventCard({ event, onEdit, onDelete, onViewDetails }: EventCardProps) {
  return (
    <Card
      className="h-full flex flex-col transition-all hover:shadow-md cursor-pointer"
      onClick={() => onViewDetails(event)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm leading-tight line-clamp-2 flex-1">
            {event.title}
          </CardTitle>
          <Badge variant={getEventTypeBadgeVariant(event.type)} className="text-xs whitespace-nowrap">
            {eventTypeLabels[event.type]}
          </Badge>
        </div>

        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <EventActions
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

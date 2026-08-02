"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { EventActions } from "./event-actions";
import { formatDate } from "@/lib/formatters";

interface EventCardProps {
  event: any;
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  onViewDetails: (event: any) => void;
}

export function EventCard({ event, onEdit, onDelete, onViewDetails }: EventCardProps) {
  const getTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      cult: "Culto",
      celebration: "Celebração",
      meeting: "Reunião",
      conference: "Conferência",
      rehearsal: "Ensaio",
      other: "Outro",
      template: "Template",
    };
    return types[type] || type;
  };

  const handleCardClick = () => {
    onViewDetails(event);
  };

  return (
    <Card 
      className="h-full flex flex-col transition-all hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm leading-tight line-clamp-2 flex-1">
            {event.title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {getTypeName(event.type)}
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users /* Music */ } from "lucide-react";
import { EventActions } from "./event-actions";

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

  const formatDate = (date: Date) => new Date(date).toLocaleDateString("pt-BR");

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        {/* Título + tipo */}
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm leading-tight line-clamp-2 flex-1">
            {event.title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {getTypeName(event.type)}
          </Badge>
        </div>

        {/* Local */}
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {/* Data + botões */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
          </div>

          <div className="flex items-center gap-2">
            {/* <span className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              {event.songs?.length || 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.participants?.length || 0}
            </span> */}

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

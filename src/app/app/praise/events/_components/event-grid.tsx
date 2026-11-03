import { Card, CardContent } from "@/components/ui/card";
import type { EventData } from "@/types";
import { EventCard } from "./event-card";

interface EventGridProps {
  events: EventData[];
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onViewDetails: (event: EventData) => void;
  isLoading?: boolean;
}

const SKELETON_COUNT = 8;
const GRID_CLASS = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function EventGrid({ events, onEdit, onDelete, onViewDetails, isLoading }: EventGridProps) {
  if (isLoading) {
    return (
      <div className={GRID_CLASS} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Card key={i} className="h-full animate-pulse">
            <CardContent className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}

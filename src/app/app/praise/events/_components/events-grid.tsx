// app/praise/events/_components/events-grid.tsx
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "./event-card";

interface EventsGridProps {
  events: any[];
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  onViewDetails: (event: any) => void;
  isLoading?: boolean;
}

export function EventsGrid({ events, onEdit, onDelete, onViewDetails, isLoading }: EventsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-full animate-pulse">
            <CardContent className="space-y-2 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
import { Calendar, Clock, Hash, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateRelative } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { RankBadge } from "./rank-badge";

export interface SongExecutionItem {
  id: number;
  eventTitle: string;
  eventDate: Date | string;
  eventType: string;
  order: number;
  notes: string | null;
}

interface SongExecutionListProps {
  executions: SongExecutionItem[];
  emptyDescription: string;
  highlightLatest?: boolean;
}

export function SongExecutionList({ executions, emptyDescription, highlightLatest = false }: SongExecutionListProps) {
  if (executions.length === 0) {
    return <EmptyState icon={Music} title="Nenhuma execução encontrada" description={emptyDescription} className="py-8" />;
  }

  return (
    <ol className="space-y-2">
      {executions.map((execution, index) => {
        const isLatest = highlightLatest && index === 0;
        return (
          <li key={execution.id} className="flex items-start gap-3 rounded-lg border p-3">
            <RankBadge rank={index + 1} variant={isLatest ? "success" : "soft"} />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 break-words text-sm font-medium">{execution.eventTitle}</span>
                <Badge variant={eventTypeBadge(execution.eventType)}>{eventTypeLabel(execution.eventType)}</Badge>
                {isLatest && <Badge variant="success">Mais recente</Badge>}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatDate(execution.eventDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatDateRelative(execution.eventDate)}
                </span>
                {execution.order > 0 && (
                  <span className="flex items-center gap-1">
                    <Hash className="size-3.5" />
                    {execution.order}ª música
                  </span>
                )}
              </div>

              {execution.notes && (
                <p className="break-words text-xs italic text-muted-foreground">&ldquo;{execution.notes}&rdquo;</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

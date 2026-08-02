import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, Music } from "lucide-react";
import { format } from "date-fns";
import { getEventTypeName } from "@/lib/formatters";
import type { Song, SongExecution } from "@/types";

interface SongDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  executions: SongExecution[] | undefined;
  isLoading: boolean;
  onFilterBySong: (song: Song) => void;
}

export function SongDetailsDialog({
  open,
  onOpenChange,
  song,
  executions,
  isLoading,
  onFilterBySong,
}: SongDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {song?.title || "Detalhes da Música"}
          </DialogTitle>
          {song?.artist && (
            <DialogDescription className="text-xs sm:text-sm">
              Artista: {song.artist}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="space-y-2 sm:space-y-3 w-full">
              <Skeleton className="h-10 sm:h-12 w-full" />
              <Skeleton className="h-10 sm:h-12 w-full" />
              <Skeleton className="h-10 sm:h-12 w-full" />
            </div>
          </div>
        ) : executions && executions.length > 0 ? (
          <ScrollArea className="max-h-[40vh] sm:max-h-[50vh]">
            <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    {executions.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Total execuções
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm sm:text-2xl font-bold text-primary">
                    {format(new Date(executions[0]?.eventDate || new Date()), "dd/MM/yyyy")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Última execução
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    {new Set(executions.map(e => e.eventId)).size}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Eventos diferentes
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 sm:space-y-2">
                {executions.map((execution, index) => (
                  <div
                    key={execution.id}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-medium text-xs sm:text-sm truncate">
                          {execution.eventTitle}
                        </span>
                        <Badge variant="outline" className="text-[8px] sm:text-xs">
                          {getEventTypeName(execution.eventType)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {format(new Date(execution.eventDate), "dd/MM/yyyy")}
                        </span>
                        {execution.order && (
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Music className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Ordem: {execution.order}
                          </span>
                        )}
                      </div>

                      {execution.notes && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 italic truncate">
                          &ldquo;{execution.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <Badge variant="secondary" className="text-[8px] sm:text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Nenhuma execução encontrada</p>
            <p className="text-xs sm:text-sm">Para esta música no período selecionado</p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogClose>
          {song && (
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                onFilterBySong(song);
                onOpenChange(false);
              }}
            >
              Filtrar por esta música
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
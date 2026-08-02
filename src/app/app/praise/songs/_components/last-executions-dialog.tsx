"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Calendar,
  Music,
  Clock,
  TrendingUp,
  ExternalLink,
  Hash,
  ArrowUp,
} from "lucide-react";
import { api } from "@/trpc/react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getEventTypeColor, getEventTypeName } from "@/lib/formatters";
import { Song } from "@/types";

interface LastExecutionsDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LastExecutionsDialog({
  song,
  open,
  onOpenChange,
}: LastExecutionsDialogProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  const { data: executions, isLoading: isLoadingExecutions } =
    api.event.getLastExecutions.useQuery(
      {
        songId: song.id,
        limit: 10,
      },
      {
        enabled: enabled && open,
      }
    );

  const { data: stats, isLoading: isLoadingStats } =
    api.event.getSongStats.useQuery(
      {
        songId: song.id,
      },
      {
        enabled: enabled && open,
      }
    );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setEnabled(true), 100);
      return () => clearTimeout(timer);
    } else {
      setEnabled(false);
    }
  }, [open]);

  const navigateToReport = () => {
    onOpenChange(false);
    router.push(`/reports?songId=${song.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <History className="h-5 w-5 text-primary" />
            Histórico de Execuções
          </DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-semibold">{song.title}</span>
            {song.artist && (
              <span className="text-muted-foreground">
                {" "}
                - {song.artist}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingExecutions || isLoadingStats ? (
          <div className="flex-1 py-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            {stats && stats.totalExecutions > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 flex-shrink-0">
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    {stats.totalExecutions}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Total execuções
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-primary">
                    {stats.lastExecution
                      ? formatDistanceToNow(new Date(stats.lastExecution), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : "-"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Última vez
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-primary">
                    {stats.averageOrder
                      ? `${Math.round(stats.averageOrder)}º`
                      : "-"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Posição média
                  </div>
                </div>
              </div>
            )}

            {/* Lista de execuções */}
            <ScrollArea className="flex-1 min-h-0">
              {executions && executions.length > 0 ? (
                <div className="space-y-2 pr-2">
                  {executions.map((execution, index) => (
                    <div
                      key={execution.id}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div
                          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold ${
                            index === 0
                              ? "bg-green-500 text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {index < executions.length - 1 && (
                          <div className="w-0.5 h-4 bg-border" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {execution.eventTitle}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[8px] sm:text-xs ${getEventTypeColor(
                              execution.eventType
                            )}`}
                          >
                            {getEventTypeName(execution.eventType)}
                          </Badge>
                          {index === 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] sm:text-xs bg-green-100 text-green-800 border-green-200"
                            >
                              MAIS RECENTE
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {format(
                              new Date(execution.eventDate),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                          </span>

                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {formatDistanceToNow(
                              new Date(execution.eventDate),
                              {
                                addSuffix: true,
                                locale: ptBR,
                              }
                            )}
                          </span>

                          {execution.order && (
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {execution.order}ª música
                            </span>
                          )}
                        </div>

                        {execution.notes && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 italic truncate">
                            &ldquo;{execution.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() =>
                          router.push(`/events/${execution.eventId}`)
                        }
                        title="Ver evento"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button> */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhuma execução encontrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta música ainda não foi tocada em nenhum evento
                  </p>
                </div>
              )}
            </ScrollArea>
          </>
        )}

        <Separator className="flex-shrink-0" />

        <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogClose>
          {/* {stats && stats.totalExecutions > 0 && (
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={navigateToReport}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Ver Relatório Completo
            </Button>
          )} */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
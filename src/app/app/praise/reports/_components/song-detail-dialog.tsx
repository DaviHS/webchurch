import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Filter, Music } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { MiniStat } from "../../_components/mini-stat";
import { SongExecutionList } from "../../_components/song-execution-list";
import type { Song, SongExecution } from "@/types";

interface SongDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  executions: SongExecution[] | undefined;
  isLoading: boolean;
  onFilterBySong: (song: Song) => void;
}

export function SongDetailDialog({ open, onOpenChange, song, executions, isLoading, onFilterBySong }: SongDetailDialogProps) {
  const latestExecution = executions?.[0];

  const handleFilterBySong = () => {
    if (!song) return;
    onFilterBySong(song);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-start gap-2 text-lg sm:text-xl">
            <Music className="mt-1 size-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{song?.title ?? "Detalhes da música"}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="break-words">
            {song?.artist ? `Artista: ${song.artist}` : "Execuções no período selecionado"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4 pb-4">
          {isLoading ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Skeleton className="h-16 w-full sm:h-20" />
                <Skeleton className="h-16 w-full sm:h-20" />
                <Skeleton className="h-16 w-full sm:h-20" />
              </div>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : (
            <>
              {executions && executions.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <MiniStat value={executions.length} label="Total de execuções" />
                  <MiniStat
                    value={latestExecution ? formatDate(latestExecution.eventDate) : "-"}
                    label="Última execução"
                    valueClassName="text-sm sm:text-base"
                  />
                  <MiniStat value={new Set(executions.map((execution) => execution.eventId)).size} label="Eventos diferentes" />
                </div>
              )}

              <SongExecutionList
                executions={executions ?? []}
                emptyDescription="Esta música não foi tocada no período selecionado."
              />
            </>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          {song && (
            <Button onClick={handleFilterBySong}>
              <Filter />
              Filtrar por esta música
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

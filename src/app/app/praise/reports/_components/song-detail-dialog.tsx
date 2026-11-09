import { useState } from "react";
import Link from "next/link";
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
import { CalendarPlus, Filter, Music, Projector } from "lucide-react";
import { api } from "@/trpc/react";
import { AddToEventDialog } from "./add-to-event-dialog";
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
  const [adding, setAdding] = useState(false);
  const latestExecution = executions?.[0];

  // Sem execuções no período: mostra as últimas vezes em que tocou, em qualquer época.
  const noneInPeriod = !isLoading && executions?.length === 0;
  const { data: recent, isLoading: isLoadingRecent } = api.report.getRecentExecutions.useQuery(
    { songId: song?.id ?? 0, limit: 5 },
    { enabled: open && song !== null && noneInPeriod },
  );

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

              {noneInPeriod ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Não foi tocada no período selecionado.</p>
                  {isLoadingRecent ? (
                    <Skeleton className="h-14 w-full" />
                  ) : (
                    <>
                      {recent && recent.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Últimas vezes</p>}
                      <SongExecutionList
                        executions={recent ?? []}
                        highlightLatest
                        emptyDescription="Esta música nunca foi tocada em um evento."
                      />
                    </>
                  )}
                </div>
              ) : (
                <SongExecutionList
                  executions={executions ?? []}
                  emptyDescription="Esta música não foi tocada no período selecionado."
                />
              )}
            </>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          {song && (
            <Button variant="outline" onClick={() => setAdding(true)}>
              <CalendarPlus />
              Adicionar a um evento
            </Button>
          )}
          {song && (
            <Button variant="outline" asChild>
              <Link href={`/presentation/control?song=${song.id}`}>
                <Projector />
                Apresentar
              </Link>
            </Button>
          )}
          {song && (
            <Button onClick={handleFilterBySong}>
              <Filter />
              Filtrar por esta música
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
      <AddToEventDialog song={song} open={adding} onOpenChange={setAdding} />
    </ResponsiveDialog>
  );
}

"use client";

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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { api } from "@/trpc/react";
import { formatDateRelative } from "@/lib/formatters";
import { MiniStat } from "../../_components/mini-stat";
import { SongExecutionList } from "../../_components/song-execution-list";
import { type Song } from "@/types";

interface LastExecutionsDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LastExecutionsDialog({ song, open, onOpenChange }: LastExecutionsDialogProps) {
  const { data: executions, isLoading: isLoadingExecutions } = api.report.getRecentExecutions.useQuery(
    { songId: song.id, limit: 10 },
    { enabled: open }
  );

  const { data: stats, isLoading: isLoadingStats } = api.report.getSongStats.useQuery(
    { songId: song.id },
    { enabled: open }
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <History className="size-5 shrink-0 text-primary" />
            Histórico de execuções
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="break-words">
            <span className="font-semibold text-foreground">{song.title}</span>
            {song.artist && ` - ${song.artist}`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4 pb-4">
          {isLoadingExecutions || isLoadingStats ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Skeleton className="h-16 w-full sm:h-20" />
                <Skeleton className="h-16 w-full sm:h-20" />
                <Skeleton className="h-16 w-full sm:h-20" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <>
              {stats && stats.totalExecutions > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <MiniStat value={stats.totalExecutions} label="Total de execuções" />
                  <MiniStat
                    value={stats.lastExecution ? formatDateRelative(stats.lastExecution) : "-"}
                    label="Última vez"
                    valueClassName="text-sm sm:text-base"
                  />
                  <MiniStat value={stats.averageOrder ? `${Math.round(stats.averageOrder)}º` : "-"} label="Posição média" />
                </div>
              )}

              <SongExecutionList
                executions={executions ?? []}
                emptyDescription="Esta música ainda não foi tocada em nenhum evento."
                highlightLatest
              />
            </>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

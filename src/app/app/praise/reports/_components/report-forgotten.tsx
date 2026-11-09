"use client";

import { useState } from "react";
import { CalendarPlus, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingState } from "@/components/ui/loading-state";
import { formatDate } from "@/lib/formatters";
import { api } from "@/trpc/react";
import type { Song } from "@/types";
import { AddToEventDialog } from "../../_components/add-to-event-dialog";

interface ForgottenListProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  songIds?: number[];
  onSongClick: (song: Song) => void;
}

interface Row {
  id: number;
  title: string;
  artist: string | null;
  lastPlayed: Date | null;
}

const VISIBLE = 10;

function Section({
  title,
  rows,
  onOpen,
  onAdd,
}: {
  title: string;
  rows: Row[];
  onOpen: (song: Song) => void;
  onAdd: (song: Song) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return null;
  const visible = showAll ? rows : rows.slice(0, VISIBLE);
  const toSong = (row: Row): Song => ({ id: row.id, title: row.title, artist: row.artist ?? "" });

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({rows.length})
      </h3>
      <ul className="divide-y rounded-md border">
        {visible.map((row) => (
          <li key={row.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onOpen(toSong(row))}
              className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{row.title}</span>
                {row.artist && <span className="block truncate text-xs text-muted-foreground">{row.artist}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                {row.lastPlayed ? formatDate(row.lastPlayed) : null}
                <ChevronRight className="size-4" />
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-1 shrink-0"
              title="Adicionar a um evento"
              aria-label={`Adicionar ${row.title} a um evento`}
              onClick={() => onAdd(toSong(row))}
            >
              <CalendarPlus />
            </Button>
          </li>
        ))}
      </ul>
      {rows.length > VISIBLE && (
        <Button type="button" variant="ghost" className="w-full" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Ver menos" : `Ver mais (${rows.length - VISIBLE})`}
        </Button>
      )}
    </section>
  );
}

/** Músicas que não tocaram no período do filtro. Só é montada (e só consulta) quando a aba é aberta. */
export function ForgottenList({ startDate, endDate, songIds, onSongClick }: ForgottenListProps) {
  const enabled = startDate !== undefined && endDate !== undefined;
  const [adding, setAdding] = useState<Song | null>(null);
  const { data, isLoading, error, refetch } = api.report.forgottenSongs.useQuery(
    { startDate: startDate!, endDate: endDate!, songIds },
    { enabled, staleTime: 60_000 },
  );

  const isEmpty = data?.forgotten.length === 0 && data.neverPlayed.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Músicas que não tocaram no período escolhido acima.</p>
      {!enabled ? (
        <EmptyState icon={History} title="Selecione um período válido" className="py-8" />
      ) : isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />
      ) : isEmpty ? (
        <EmptyState icon={History} title="Nenhuma música esquecida" description="Todas tocaram neste período." className="py-8" />
      ) : (
        <>
          <Section title="Esquecidas" rows={data?.forgotten ?? []} onOpen={onSongClick} onAdd={setAdding} />
          <Section title="Nunca tocadas" rows={data?.neverPlayed ?? []} onOpen={onSongClick} onAdd={setAdding} />
        </>
      )}
      <AddToEventDialog song={adding} open={adding !== null} onOpenChange={(open) => !open && setAdding(null)} />
    </div>
  );
}

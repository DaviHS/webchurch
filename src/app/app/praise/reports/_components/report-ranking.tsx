"use client";

import { useState } from "react";
import { ChevronRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RankBadge } from "../../_components/rank-badge";
import { ForgottenList } from "./report-forgotten";
import type { ReportItem, Song } from "@/types";

interface ReportRankingProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onSongClick: (song: Song) => void;
  /** Período e músicas do filtro, usados também pela aba "Esquecidas". */
  startDate?: Date;
  endDate?: Date;
  songIds?: number[];
  /** Sem resultados no período: oferece olhar um período maior. */
  onWiden?: () => void;
}

const VISIBLE = 10;

type Mode = "top" | "forgotten";

const MODES: { value: Mode; label: string }[] = [
  { value: "top", label: "Mais tocadas" },
  { value: "forgotten", label: "Esquecidas" },
];

/** Ranking com barra proporcional em cada linha. O alternador mostra, sob demanda, as músicas esquecidas. */
export function ReportRanking({ report, isLoading, isDateRangeValid, onSongClick, startDate, endDate, songIds, onWiden }: ReportRankingProps) {
  const [mode, setMode] = useState<Mode>("top");
  const [showAll, setShowAll] = useState(false);

  const items = report ?? [];
  const max = Math.max(1, ...items.map((item) => item.count));
  const visible = showAll ? items : items.slice(0, VISIBLE);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <div role="radiogroup" aria-label="Lista" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                "min-h-10 rounded-md text-sm font-medium transition-colors",
                mode === option.value ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {mode === "forgotten" ? (
          <ForgottenList startDate={startDate} endDate={endDate} songIds={songIds} onSongClick={onSongClick} />
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : items.length > 0 ? (
          <>
            <ol className="space-y-2">
              {visible.map((item, index) => (
                <li key={item.songId}>
                  <button
                    type="button"
                    className="group relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-md border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSongClick({ id: item.songId, title: item.title, artist: item.artist ?? "" })}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 bg-primary/10"
                      style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                    />
                    <RankBadge rank={index + 1} />
                    <div className="relative min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.artist === null || item.artist === "" ? "Artista desconhecido" : item.artist}
                      </div>
                    </div>
                    <div className="relative shrink-0 text-sm font-bold tabular-nums">{item.count}x</div>
                    <ChevronRight className="relative size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ol>
            {items.length > VISIBLE && (
              <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Ver menos" : `Ver todas (${items.length})`}
              </Button>
            )}
          </>
        ) : (
          <EmptyState
            icon={Music}
            title="Nenhuma música neste período"
            description={isDateRangeValid ? "Ajuste os filtros para ver os resultados." : "Selecione um período válido para consultar."}
            className="py-8"
            action={
              onWiden && isDateRangeValid ? (
                <Button type="button" variant="outline" onClick={onWiden}>
                  Ver os últimos 12 meses
                </Button>
              ) : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { List, Music, ChevronRight } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import { RankBadge } from "../../_components/rank-badge";
import type { ReportItem, Song } from "@/types";

interface ReportRankingProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onSongClick: (song: Song) => void;
}

export function ReportRanking({ report, isLoading, isDateRangeValid, onSongClick }: ReportRankingProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-2 p-4">
          <Skeleton className="h-5 w-40 sm:w-48" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <Skeleton className="h-14 w-full sm:h-16" />
            <Skeleton className="h-14 w-full sm:h-16" />
            <Skeleton className="h-14 w-full sm:h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = report?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <List className="size-4 shrink-0 text-primary" />
          Ranking de músicas
        </CardTitle>
        <p className="text-sm text-muted-foreground">Toque em uma música para ver detalhes</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {report && report.length > 0 ? (
          <ol className="space-y-2">
            {report.map((item, index) => (
              <li key={item.songId}>
                <button
                  type="button"
                  className="group flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    onSongClick({
                      id: item.songId,
                      title: item.title,
                      artist: item.artist ?? "",
                    })
                  }
                >
                  <RankBadge rank={index + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.artist === null || item.artist === "" ? "Artista desconhecido" : item.artist}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold tabular-nums">{item.count}x</div>
                    <div className="text-xs tabular-nums text-muted-foreground">{formatPercent(item.count, total)}%</div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={Music}
            title="Nenhuma música encontrada"
            description={
              isDateRangeValid ? "Ajuste os filtros para ver os resultados." : "Selecione um período válido para consultar."
            }
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}

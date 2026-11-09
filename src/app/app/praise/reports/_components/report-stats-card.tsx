import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateRange, formatNumber } from "@/lib/formatters";
import type { ReportStats } from "@/types";

interface ReportStatsCardProps {
  stats: ReportStats | null;
  isLoading: boolean;
  periodText: string;
  /** Execuções no período anterior de mesma duração, para comparar. */
  comparison?: { current: number; previous: number; previousStart: Date; previousEnd: Date } | null;
}

/** Resumo no topo: quantas vezes se tocou, quantas músicas diferentes e como isso se compara ao período anterior. */
export function ReportStatsCard({ stats, isLoading, periodText, comparison }: ReportStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Execuções{periodText && <span className="font-normal normal-case"> · {periodText}</span>}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-bold tabular-nums">{formatNumber(stats.totalExecutions)}</p>
          <p className="text-sm text-muted-foreground">
            em {stats.totalSongs} {stats.totalSongs === 1 ? "música" : "músicas diferentes"}
          </p>
        </div>
        {comparison && <PeriodComparison {...comparison} />}
      </CardContent>
    </Card>
  );
}

function PeriodComparison({ current, previous, previousStart, previousEnd }: { current: number; previous: number; previousStart: Date; previousEnd: Date }) {
  const diff = current - previous;
  const percent = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const label =
    diff === 0
      ? "Igual ao período anterior"
      : `${diff > 0 ? "+" : ""}${percent !== null ? `${percent}%` : formatNumber(diff)} sobre o período anterior`;
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {diff > 0 ? <TrendingUp className="size-4 text-success" /> : diff < 0 ? <TrendingDown className="size-4 text-destructive" /> : null}
      <span>
        {label}
        <span className="block text-xs">
          Antes: {formatNumber(previous)} execuções, de {formatDateRange(previousStart, previousEnd)}
        </span>
      </span>
    </p>
  );
}

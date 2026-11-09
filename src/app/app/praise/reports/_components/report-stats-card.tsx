import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { formatNumber, formatMedia } from "@/lib/formatters";
import { MiniStat } from "../../_components/mini-stat";
import type { ReportStats } from "@/types";

interface ReportStatsCardProps {
  stats: ReportStats | null;
  isLoading: boolean;
  periodText: string;
  /** Execuções no período anterior de mesma duração, para comparar. */
  comparison?: { current: number; previous: number } | null;
}

export function ReportStatsCard({ stats, isLoading, periodText, comparison }: ReportStatsCardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Skeleton className="h-16 w-full sm:h-20" />
            <Skeleton className="h-16 w-full sm:h-20" />
            <Skeleton className="h-16 w-full sm:h-20" />
            <Skeleton className="h-16 w-full sm:h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
          <PieChart className="size-4 shrink-0 text-primary" />
          Estatísticas
          {periodText && <span className="text-sm font-normal text-muted-foreground">({periodText})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <MiniStat value={stats.totalSongs} label="Músicas diferentes" />
          <MiniStat value={formatNumber(stats.totalExecutions)} label="Total de execuções" />
          <MiniStat value={formatMedia(stats.average)} label="Média por música" />
          <MiniStat value={`${stats.maxExecutions}x`} label="Mais executada" />
        </div>
        {comparison && <PeriodComparison {...comparison} />}
      </CardContent>
    </Card>
  );
}

function PeriodComparison({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const percent = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const trend = diff === 0 ? "igual ao" : diff > 0 ? "acima do" : "abaixo do";
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
      {diff > 0 ? <TrendingUp className="size-4 text-success" /> : diff < 0 ? <TrendingDown className="size-4 text-destructive" /> : null}
      <span>
        {formatNumber(current)} execuções, {trend} período anterior ({formatNumber(previous)}
        {percent !== null && diff !== 0 ? `, ${diff > 0 ? "+" : ""}${percent}%` : ""}).
      </span>
    </p>
  );
}

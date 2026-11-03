import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart } from "lucide-react";
import { formatNumber, formatMedia } from "@/lib/formatters";
import { MiniStat } from "../../_components/mini-stat";
import type { ReportStats } from "@/types";

interface ReportStatsCardProps {
  stats: ReportStats | null;
  isLoading: boolean;
  periodText: string;
}

export function ReportStatsCard({ stats, isLoading, periodText }: ReportStatsCardProps) {
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
      </CardContent>
    </Card>
  );
}

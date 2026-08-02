import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart } from "lucide-react";
import { formatNumber, formatMedia } from "@/lib/formatters";
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
        <CardHeader className="p-3 sm:p-4">
          <Skeleton className="h-5 w-32 sm:w-48" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Skeleton className="h-14 sm:h-20 w-full" />
            <Skeleton className="h-14 sm:h-20 w-full" />
            <Skeleton className="h-14 sm:h-20 w-full" />
            <Skeleton className="h-14 sm:h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <PieChart className="h-4 w-4 text-primary" />
          Estatísticas {periodText && `(${periodText})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatItem value={stats.totalMusicas} label="Músicas diferentes" />
          <StatItem value={formatNumber(stats.totalExecucoes)} label="Total execuções" />
          <StatItem value={formatMedia(stats.media)} label="Média por música" />
          <StatItem value={`${stats.maxExecucoes}x`} label="Mais executada" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center p-2 sm:p-3 border rounded-lg">
      <div className="text-base sm:text-xl font-bold text-primary">{value}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Music } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CustomTooltip } from "./custom-tooltip";
import type { ReportItem, Song } from "@/types";

interface ReportChartProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onBarClick: (song: Song) => void;
}

const MAX_BARS = 10;

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const AXIS_LINE = { stroke: "hsl(var(--border))" };

export function ReportChart({ report, isLoading, isDateRangeValid, onBarClick }: ReportChartProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <Skeleton className="h-5 w-32 sm:w-48" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Skeleton className="h-48 sm:h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (report ?? []).slice(0, MAX_BARS).map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Distribuição de execuções
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {chartData.length > 0 ? (
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="title"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  interval={0}
                />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} allowDecimals={false} />
                <Tooltip content={CustomTooltip} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.6 }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(_, index) => {
                    const item = chartData[index];
                    if (item) {
                      onBarClick({ id: item.songId, title: item.title, artist: item.artist ?? "" });
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Music}
            title="Nenhum dado disponível"
            description={
              !isDateRangeValid
                ? "Selecione um período válido para consultar."
                : "Não há execuções de músicas com os filtros selecionados."
            }
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}

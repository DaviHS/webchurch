"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Music } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { CustomTooltip } from "./custom-tooltip";
import type { ReportItem, Song } from "@/types";

interface ReportChartProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onBarClick: (song: Song) => void;
}

const MAX_BARS = 10;
const MOBILE_LABEL_LENGTH = 16;
const DESKTOP_LABEL_LENGTH = 22;

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const AXIS_LINE = { stroke: "hsl(var(--border))" };
const CURSOR = { fill: "hsl(var(--muted))", fillOpacity: 0.6 };

const truncateLabel = (maxLength: number) => (value: string) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export function ReportChart({ report, isLoading, isDateRangeValid, onBarClick }: ReportChartProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-80 w-full md:h-72" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (report ?? []).slice(0, MAX_BARS).map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const handleBarClick = (index: number) => {
    const item = chartData[index];
    if (item) {
      onBarClick({ id: item.songId, title: item.title, artist: item.artist ?? "" });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4 shrink-0 text-primary" />
          Distribuição de execuções
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {chartData.length > 0 ? (
          <div className="h-80 w-full md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {isMobile ? (
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={120}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={0}
                    tickFormatter={truncateLabel(MOBILE_LABEL_LENGTH)}
                  />
                  <Tooltip content={CustomTooltip} cursor={CURSOR} />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    onClick={(_, index) => handleBarClick(index)}
                    cursor="pointer"
                  />
                </BarChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="title"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickFormatter={truncateLabel(DESKTOP_LABEL_LENGTH)}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={0}
                  />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} allowDecimals={false} />
                  <Tooltip content={CustomTooltip} cursor={CURSOR} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(_, index) => handleBarClick(index)} cursor="pointer" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Music}
            title="Nenhum dado disponível"
            description={
              isDateRangeValid
                ? "Não há execuções de músicas com os filtros selecionados."
                : "Selecione um período válido para consultar."
            }
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}

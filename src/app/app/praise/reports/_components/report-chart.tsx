"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Music } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { CustomTooltip } from "./custom-tooltip";
import type { ReportItem, Song } from "@/types";

interface ReportChartProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onBarClick: (song: Song) => void;
}

const MAX_BARS = 10;
const LABEL_LENGTH = 22;
/** Uma cor só: as barras medem a mesma coisa (execuções), então cor diferente por barra não significaria nada. */
const BAR_COLOR = "hsl(var(--chart-1))";

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const AXIS_LINE = { stroke: "hsl(var(--border))" };
const CURSOR = { fill: "hsl(var(--muted))", fillOpacity: 0.6 };

const truncateLabel = (value: string) => (value.length > LABEL_LENGTH ? `${value.slice(0, LABEL_LENGTH - 1)}…` : value);

/** Gráfico de barras para telas largas. No celular o próprio ranking, com barras em cada linha, já faz esse papel. */
export function ReportChart({ report, isLoading, isDateRangeValid, onBarClick }: ReportChartProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (report ?? []).slice(0, MAX_BARS).map((item) => ({ ...item, fill: BAR_COLOR }));

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
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="title"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={truncateLabel}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  interval={0}
                />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} allowDecimals={false} />
                <Tooltip content={CustomTooltip} cursor={CURSOR} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(_, index) => handleBarClick(index)} cursor="pointer" />
              </BarChart>
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

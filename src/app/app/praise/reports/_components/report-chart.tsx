import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Music } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { COLORS } from "@/lib/contants";
import { safeParseNumber } from "@/lib/formatters";
import { CustomTooltip } from "./custom-tooltip";
import type { ReportItem, Song } from "@/types";

interface ReportChartProps {
  report: ReportItem[] | undefined;
  isLoading: boolean;
  isDateRangeValid: boolean;
  onBarClick: (song: Song) => void;
}

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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Distribuição de Execuções
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {report && report.length > 0 ? (
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.slice(0, 10).map(item => ({
                  ...item,
                  count: safeParseNumber(item.count)
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="title"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <CustomTooltip />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => {
                    if (data?.payload) {
                      onBarClick({
                        id: data.payload.songId,
                        title: data.payload.title,
                        artist: data.payload.artist,
                      });
                    }
                  }}
                  cursor="pointer"
                >
                  {report.slice(0, 10).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Nenhum dado disponível</p>
            <p className="text-xs sm:text-sm">
              {!isDateRangeValid 
                ? "Selecione um período válido para consultar" 
                : "Não há execuções de músicas com os filtros selecionados"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
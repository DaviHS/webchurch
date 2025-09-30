"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Calendar, Music, TrendingUp } from "lucide-react";
import { api } from "@/trpc/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { COLORS } from "@/lib/contants";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].payload.artist || "Artista desconhecido"}
        </p>
        <p className="font-medium text-primary">
          {payload[0].value} execuções
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const { data: report, isLoading } = api.event.getSongsReport.useQuery({
    days: Number(timeRange),
  });

  const getCategoryColor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  const exportToCSV = () => {
    if (!report) return;

    const headers = ["Posição", "Música", "Artista", "Execuções"];
    const csvContent = [
      headers.join(","),
      ...report.map((item, index) => 
        [index + 1, `"${item.title}"`, `"${item.artist || ''}"`, item.count].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-musicas-${timeRange}dias.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Relatórios de Louvor
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de músicas mais executadas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportToCSV} disabled={!report || report.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Distribuição de Execuções
            </CardTitle>
            <Badge variant="secondary">
              {timeRange} dias
            </Badge>
          </CardHeader>
          <CardContent>
            {report && report.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={report.slice(0, 10)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="title" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {report.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum dado disponível</p>
                <p>Não há execuções de músicas no período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Distribuição por Música (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            {report && report.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ title, percent }) => `${title}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {report.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} execuções`, 'Quantidade']}
                        labelFormatter={(label) => `Música: ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {report.slice(0, 5).map((item, index) => (
                    <div key={item.songId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(index) }}
                        />
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.artist || "Artista desconhecido"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{item.count}x</div>
                        <div className="text-xs text-muted-foreground">
                          {((item.count / report.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum dado disponível para exibir o gráfico</p>
              </div>
            )}
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Ranking Completo de Músicas</CardTitle>
          </CardHeader>
          <CardContent>
            {report && report.length > 0 ? (
              <div className="space-y-3">
                {report.map((item, index) => (
                  <div key={item.songId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.artist || "Artista desconhecido"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">{item.count}x</div>
                      <div className="text-xs text-muted-foreground">
                        {((item.count / report.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma música foi executada no período selecionado</p>
                <p className="text-sm">Os relatórios serão gerados automaticamente quando houver dados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {report && report.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{report.length}</div>
                  <div className="text-sm text-muted-foreground">Músicas diferentes</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {report.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de execuções</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {(report.reduce((sum, item) => sum + item.count, 0) / report.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Média por música</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {report[0]?.count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Música mais executada</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
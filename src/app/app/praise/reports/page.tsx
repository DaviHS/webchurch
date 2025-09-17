"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30"); // 30 dias
  const { data: report, isLoading } = api.event.getSongsReport.useQuery({
    days: Number(timeRange),
  });

  if (isLoading) return <div>Carregando relatórios...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Relatórios de Louvor</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Músicas Mais Tocadas</CardTitle>
            <select
              className="border rounded-md px-3 py-2"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Últimos 365 dias</option>
            </select>
          </CardHeader>
          <CardContent>
            {report && report.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dado disponível para o período selecionado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Músicas</CardTitle>
          </CardHeader>
          <CardContent>
            {report && report.length > 0 ? (
              <div className="space-y-2">
                {report.slice(0, 10).map((item, index) => (
                  <div key={item.songId} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.artist}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">{item.count}x</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma música tocada no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
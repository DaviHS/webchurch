"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingState } from "@/components/ui/loading-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/formatters";
import { api } from "@/trpc/react";

const OPTIONS = [
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "6 meses" },
  { value: "365", label: "1 ano" },
];

/** Músicas que não entram no repertório há um tempo. Fica recolhido: só consulta quando a pessoa abre. */
export function ReportForgotten() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("90");
  const { data, isLoading, error, refetch } = api.report.forgottenSongs.useQuery(
    { days: Number(days) },
    { enabled: open, staleTime: 60_000 },
  );

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-4">
          <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left">
            <CardTitle className="flex flex-1 items-center gap-2 text-base">
              <History className="size-4 text-primary" />
              Músicas esquecidas
            </CardTitle>
            <span className="text-xs text-muted-foreground">{open ? "Ocultar" : "Mostrar"}</span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Sem tocar há
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-28" aria-label="Tempo sem tocar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />
            ) : !data || data.length === 0 ? (
              <EmptyState icon={History} title="Nenhuma música esquecida" description="Todas tocaram neste período." />
            ) : (
              <ul className="divide-y rounded-md border">
                {data.map((song) => (
                  <li key={song.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      {song.artist && <p className="truncate text-xs text-muted-foreground">{song.artist}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {song.lastPlayed ? `Última vez: ${formatDate(song.lastPlayed)}` : "Nunca tocada"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

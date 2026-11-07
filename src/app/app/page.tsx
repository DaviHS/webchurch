"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { api } from "@/trpc/react";
import { subDays } from "date-fns";
import { Music, Calendar, BarChart3, Home, CalendarClock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { RankBadge } from "./praise/_components/rank-badge";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: songsStats, isLoading: isLoadingSongs } = api.song.list.useQuery({ limit: 1 });
  const { data: eventsStats, isLoading: isLoadingEvents } = api.event.list.useQuery({ limit: 1 });
  const [lastYear] = useState(() => {
    const endDate = new Date();
    return { startDate: subDays(endDate, 365), endDate };
  });
  const { data: recentSongs, isLoading: isLoadingRanking } = api.report.getSongRanking.useQuery(lastYear);

  return (
    <PageContainer>
      <PageHeader
        title="Início"
        icon={Home}
        description={session?.user?.name ? `Bem-vindo, ${session.user.name}!` : "Bem-vindo!"}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          title="Músicas"
          value={songsStats?.total ?? 0}
          description="Total cadastradas"
          icon={Music}
          href="/app/praise/songs"
          isLoading={isLoadingSongs}
        />
        <StatCard
          title="Eventos"
          value={eventsStats?.total ?? 0}
          description="Total realizados"
          icon={Calendar}
          href="/app/praise/events"
          isLoading={isLoadingEvents}
        />
        <StatCard
          title="Músicas tocadas"
          value={recentSongs?.length ?? 0}
          description="Último ano"
          icon={BarChart3}
          isLoading={isLoadingRanking}
        />
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Músicas mais tocadas (último ano)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoadingRanking ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : recentSongs && recentSongs.length > 0 ? (
            <ol className="space-y-2">
              {recentSongs.slice(0, 5).map((song, index) => (
                <li key={song.songId} className="flex items-center gap-3 rounded-lg border p-3">
                  <RankBadge rank={index + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold sm:text-base">{song.title}</div>
                    {song.artist && <div className="truncate text-xs text-muted-foreground sm:text-sm">{song.artist}</div>}
                  </div>
                  <div className="shrink-0 text-base font-bold tabular-nums sm:text-lg">{song.count}x</div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={Music} title="Nenhuma música tocada no último ano" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Próximos eventos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <EmptyState icon={CalendarClock} title="Em breve" description="Os próximos eventos agendados aparecerão aqui." />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { api } from "@/trpc/react";
import { subDays } from "date-fns";
import { Music, Calendar, Users, BarChart3, Home, CalendarClock } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  href?: string;
}

function StatCard({ title, value, hint, icon: Icon, href }: StatCardProps) {
  const card = (
    <Card className={href ? "h-full transition-shadow hover:shadow-md" : "h-full"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: songsStats } = api.song.list.useQuery({ limit: 1 });
  const { data: eventsStats } = api.event.list.useQuery({ limit: 1 });
  const [lastWeek] = useState(() => {
    const endDate = new Date();
    return { startDate: subDays(endDate, 7), endDate };
  });
  const { data: recentSongs } = api.event.getSongsReport.useQuery(lastWeek);

  return (
    <PageContainer>
      <PageHeader
        title="Início"
        icon={Home}
        description={session?.user?.name ? `Bem-vindo, ${session.user.name}!` : "Bem-vindo!"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Músicas" value={songsStats?.total ?? 0} hint="Total cadastradas" icon={Music} href="/app/praise/songs" />
        <StatCard title="Eventos" value={eventsStats?.total ?? 0} hint="Total realizados" icon={Calendar} href="/app/praise/events" />
        <StatCard title="Músicas recentes" value={recentSongs?.length ?? 0} hint="Últimos 7 dias" icon={BarChart3} />
        <StatCard title="Equipe" value="-" hint="Integrantes" icon={Users} href="/app/admin/members" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Músicas mais tocadas (última semana)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSongs && recentSongs.length > 0 ? (
            <div className="space-y-3">
              {recentSongs.slice(0, 5).map((song, index) => (
                <div key={song.songId} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{song.title}</div>
                      <div className="truncate text-sm text-muted-foreground">{song.artist}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{song.count}x</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Music} title="Nenhuma música tocada na última semana" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={CalendarClock} title="Em breve" description="Os próximos eventos agendados aparecerão aqui." />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

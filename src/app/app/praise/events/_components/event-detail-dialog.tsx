"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Calendar, Clock, Info, Loader2, MapPin, Music, Projector, User, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime } from "@/lib/formatters";
import { eventTypeBadge, eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";
import type { EventData, EventWithDetails } from "@/types";
import { EventParticipantsManager } from "./event-participants-manager";
import { EventSongsManager } from "./event-songs-manager";

interface EventDetailDialogProps {
  event: EventData | EventWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

function InfoField({ label, icon: Icon, children }: { label: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="size-4" />}
        {label}
      </p>
      <div className="break-words font-medium">{children}</div>
    </div>
  );
}

export function EventDetailDialog({ event, open, onOpenChange, isLoading = false }: EventDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const utils = api.useUtils();

  const songs = "songs" in event ? event.songs : [];
  const participants = "participants" in event ? event.participants : [];
  const hasMessage = Boolean(event.preacher) || Boolean(event.bibleVerse);

  const handleUpdate = () => {
    void utils.event.getById.invalidate(event.id);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl" className="h-[95dvh] sm:h-[90dvh]">
        <ResponsiveDialogHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <ResponsiveDialogTitle className="text-lg sm:text-xl">Carregando…</ResponsiveDialogTitle>
                </div>
              ) : (
                <>
                  <ResponsiveDialogTitle className="line-clamp-2 break-words text-lg sm:text-xl">
                    {event.title}
                  </ResponsiveDialogTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={eventTypeBadge(event.type)}>{eventTypeLabel(event.type)}</Badge>
                    <Badge variant="outline">
                      <Calendar className="mr-1 size-3" />
                      {formatDate(event.date)}
                    </Badge>
                    {event.startTime && (
                      <Badge variant="outline">
                        <Clock className="mr-1 size-3" />
                        {formatTime(event.startTime)}
                      </Badge>
                    )}
                  </div>
                </>
              )}
              <ResponsiveDialogDescription className="sr-only">
                Informações, repertório e participantes do evento
              </ResponsiveDialogDescription>
            </div>
            {!isLoading && (
              <Button asChild className="w-full shrink-0 sm:w-auto">
                <Link href={`/presentation/control?event=${event.id}`}>
                  <Projector />
                  Apresentar
                </Link>
              </Button>
            )}
          </div>
        </ResponsiveDialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState message="Carregando evento…" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-4 pt-3 sm:px-6">
              <TabsList className="grid h-11 w-full grid-cols-3 sm:h-9">
                <TabsTrigger value="info" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Info className="hidden size-4 sm:block" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="songs" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Music className="hidden size-4 sm:block" />
                  Repertório
                </TabsTrigger>
                <TabsTrigger value="participants" className="h-full gap-1 px-1 text-xs sm:px-3 sm:text-sm">
                  <Users className="hidden size-4 sm:block" />
                  Participantes
                </TabsTrigger>
              </TabsList>
            </div>

            <ResponsiveDialogBody className="pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:pb-6">
              <TabsContent value="info" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="size-5" />
                      Informações do evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField label="Tipo">{eventTypeLabel(event.type)}</InfoField>

                    <InfoField label="Data e horário" icon={Calendar}>
                      <span className="flex flex-wrap items-center gap-2">
                        {formatDate(event.date)}
                        {event.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" />
                            {formatTime(event.startTime)}
                            {event.endTime && <> - {formatTime(event.endTime)}</>}
                          </span>
                        )}
                      </span>
                    </InfoField>

                    {event.location && (
                      <InfoField label="Local" icon={MapPin}>
                        {event.location}
                      </InfoField>
                    )}
                  </CardContent>
                </Card>

                {hasMessage && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="size-5" />
                        Mensagem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {event.preacher && (
                        <InfoField label="Pregador" icon={User}>
                          {event.preacher}
                        </InfoField>
                      )}
                      {event.bibleVerse && <InfoField label="Versículo bíblico">{event.bibleVerse}</InfoField>}
                    </CardContent>
                  </Card>
                )}

                {event.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap break-words text-muted-foreground">{event.description}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-lg border p-3 text-center">
                        <Music className="mx-auto mb-2 size-6 text-primary" />
                        <div className="text-2xl font-bold">{songs.length}</div>
                        <div className="text-sm text-muted-foreground">Músicas</div>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <Users className="mx-auto mb-2 size-6 text-primary" />
                        <div className="text-2xl font-bold">{participants.length}</div>
                        <div className="text-sm text-muted-foreground">Participantes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="songs" className="mt-0">
                <EventSongsManager eventId={event.id} songs={songs} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="participants" className="mt-0">
                <EventParticipantsManager eventId={event.id} participants={participants} onUpdate={handleUpdate} />
              </TabsContent>
            </ResponsiveDialogBody>
          </Tabs>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

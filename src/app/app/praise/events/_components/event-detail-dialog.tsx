"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Music, Users, Loader2, Calendar, MapPin, User, BookOpen, Clock, Projector } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSongsManager } from "./event-songs-manager";
import { EventParticipantsManager } from "./event-participants-manager";
import { api } from "@/trpc/react";
import { formatDate, formatTime } from "@/lib/formatters";
import type { EventData, EventWithDetails } from "@/types";
import { eventTypeLabels, getEventTypeBadgeVariant } from "./event-type";

interface EventDetailDialogProps {
  event: EventData | EventWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] flex flex-col w-[95vw] sm:w-full p-0">
        <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <DialogTitle className="text-lg sm:text-xl">Carregando...</DialogTitle>
                </div>
              ) : (
                <>
                  <DialogTitle className="text-lg sm:text-xl line-clamp-2">
                    {event.title}
                  </DialogTitle>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant={getEventTypeBadgeVariant(event.type)}>{eventTypeLabels[event.type]}</Badge>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(event.date)}
                    </Badge>
                    {event.startTime && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(event.startTime)}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
            {!isLoading && (
              <Button asChild size="sm" className="ml-3 mr-6 shrink-0">
                <Link href={`/presentation/control?event=${event.id}`}>
                  <Projector className="mr-2 h-4 w-4" />
                  Apresentar
                </Link>
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState message="Carregando evento..." />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <div className="px-4 pt-0 shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info" className="text-xs sm:text-sm">
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="songs" className="text-xs sm:text-sm">
                    <Music className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Repertório
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Participantes
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-4 pb-4 pt-4">
                <TabsContent value="info" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Informações do evento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                        <p className="font-medium">{eventTypeLabels[event.type]}</p>
                      </div>

                      <div>
                        <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Data e horário
                        </p>
                        <p className="flex items-center gap-2 font-medium">
                          {formatDate(event.date)}
                          {event.startTime && (
                            <>
                              <Clock className="h-4 w-4" />
                              {formatTime(event.startTime)}
                              {event.endTime && <> - {formatTime(event.endTime)}</>}
                            </>
                          )}
                        </p>
                      </div>

                      {event.location && (
                        <div>
                          <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            Local
                          </p>
                          <p className="font-medium">{event.location}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {hasMessage && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Mensagem
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.preacher && (
                          <div>
                            <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                              <User className="h-4 w-4" />
                              Pregador
                            </p>
                            <p className="font-medium">{event.preacher}</p>
                          </div>
                        )}
                        {event.bibleVerse && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Versículo bíblico</p>
                            <p className="font-medium">{event.bibleVerse}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {event.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Descrição</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <Music className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{songs.length}</div>
                          <div className="text-sm text-muted-foreground">Músicas</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{participants.length}</div>
                          <div className="text-sm text-muted-foreground">Participantes</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="songs" className="mt-0">
                  <EventSongsManager 
                    eventId={event.id}
                    songs={songs}
                    onUpdate={handleUpdate}
                  />
                </TabsContent>

                <TabsContent value="participants" className="mt-0">
                  <EventParticipantsManager 
                    eventId={event.id}
                    participants={participants}
                    onUpdate={handleUpdate}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
// src/app/praise/events/_components/event-detail-dialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Users, X, Loader2, Calendar, MapPin, User, BookOpen, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSongsManager } from "./event-songs-manager";
import { EventParticipantsManager } from "./event-participants-manager";
import { api } from "@/trpc/react";

interface EventDetailDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function EventDetailDialog({ event, open, onOpenChange, isLoading = false }: EventDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const utils = api.useUtils();

  if (!event && !isLoading) return null;

  const getTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      cult: "Culto",
      celebration: "Celebração",
      meeting: "Reunião",
      conference: "Conferência",
      rehearsal: "Ensaio",
      other: "Outro",
      template: "Template"
    };
    return types[type] || type;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    return time.includes(':') ? time : `${time.substring(0, 2)}:${time.substring(2)}`;
  };

  const handleUpdate = () => {
    utils.event.getById.invalidate(event.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] flex flex-col w-[95vw] sm:w-full p-0">
        <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <DialogTitle className="text-lg sm:text-xl">Carregando...</DialogTitle>
                </div>
              ) : (
                <>
                  <DialogTitle className="text-lg sm:text-xl line-clamp-2">
                    {event.title}
                  </DialogTitle>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="secondary">{getTypeName(event.type)}</Badge>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 -mt-2 -mr-2 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 flex-1">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="grid grid-cols-3 p-2 mx-4 mt-2 shrink-0">
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

              <ScrollArea className="flex-1 px-4 pb-4">
                <TabsContent value="info" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Informações do Evento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                          <p className="font-medium">{getTypeName(event.type)}</p>
                        </div>

                        {/* Data e Horários */}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Data e Horário
                          </label>
                          <p className="font-medium flex items-center gap-2">
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
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Local
                            </label>
                            <p className="font-medium">{event.location}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {event.preacher && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Pregador
                            </label>
                            <p className="font-medium">{event.preacher}</p>
                          </div>
                        )}
                        {event.bibleVerse && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Versículo Bíblico</label>
                            <p className="font-medium">{event.bibleVerse}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>


                  {/* Card de Pregador e Versículo */}
                  {(event.preacher || event.bibleVerse) && (
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
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Pregador
                            </label>
                            <p className="font-medium">{event.preacher}</p>
                          </div>
                        )}
                        {event.bibleVerse && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Versículo Bíblico</label>
                            <p className="font-medium">{event.bibleVerse}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Card de Descrição */}
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

                  {/* Card de Estatísticas */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <Music className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{event.songs?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Músicas</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{event.participants?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Participantes</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="songs" className="mt-4">
                  <EventSongsManager 
                    eventId={event.id}
                    songs={event.songs || []}
                    onUpdate={handleUpdate}
                  />
                </TabsContent>

                <TabsContent value="participants" className="mt-4">
                  <EventParticipantsManager 
                    eventId={event.id}
                    participants={event.participants || []}
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
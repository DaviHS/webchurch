"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ArrowLeft, Edit, Plus, Music, Users } from "lucide-react";
import { toast } from "sonner";
import { EventSongsManager } from "../_components/event-songs-manager";
import { EventParticipantsManager } from "../_components/event-participants-manager";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use o hook use para resolver a Promise
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const { data: event, isLoading, refetch } = api.event.getById.useQuery(eventId);

  if (isLoading) return <div>Carregando...</div>;
  if (!event) return <div>Evento não encontrado</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <Button onClick={() => router.push(`/events/${eventId}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === "info" ? "default" : "outline"}
          onClick={() => setActiveTab("info")}
        >
          Informações
        </Button>
        <Button
          variant={activeTab === "songs" ? "default" : "outline"}
          onClick={() => setActiveTab("songs")}
        >
          <Music className="mr-2 h-4 w-4" />
          Repertório
        </Button>
        <Button
          variant={activeTab === "participants" ? "default" : "outline"}
          onClick={() => setActiveTab("participants")}
        >
          <Users className="mr-2 h-4 w-4" />
          Participantes
        </Button>
      </div>

      {activeTab === "info" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-muted-foreground">
                    {event.type === "cult" && "Culto"}
                    {event.type === "celebration" && "Celebração"}
                    {event.type === "meeting" && "Reunião"}
                    {event.type === "conference" && "Conferência"}
                    {event.type === "other" && "Outro"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <p className="text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Local</label>
                  <p className="text-muted-foreground">{event.location || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Pregador</label>
                  <p className="text-muted-foreground">{event.preacher || "Não informado"}</p>
                </div>
                {event.startTime && (
                  <div>
                    <label className="text-sm font-medium">Hora de Início</label>
                    <p className="text-muted-foreground">{event.startTime}</p>
                  </div>
                )}
                {event.endTime && (
                  <div>
                    <label className="text-sm font-medium">Hora de Término</label>
                    <p className="text-muted-foreground">{event.endTime}</p>
                  </div>
                )}
              </div>

              {event.bibleVerse && (
                <div>
                  <label className="text-sm font-medium">Versículo Bíblico</label>
                  <p className="text-muted-foreground">{event.bibleVerse}</p>
                </div>
              )}

              {event.description && (
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "songs" && (
        <EventSongsManager eventId={eventId} songs={event.songs} onUpdate={refetch} />
      )}

      {activeTab === "participants" && (
        <EventParticipantsManager eventId={eventId} participants={event.participants} onUpdate={refetch} />
      )}
    </div>
  );
}
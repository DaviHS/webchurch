"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddParticipantToEvent } from "./add-participant-to-event";

interface EventParticipantsManagerProps {
  eventId: number;
  participants: any[];
  onUpdate: () => void;
}

export function EventParticipantsManager({ eventId, participants, onUpdate }: EventParticipantsManagerProps) {
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const removeParticipant = api.event.removeParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participante removido do evento!");
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao remover participante: " + error.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Participantes do Evento</CardTitle>
        <Button onClick={() => setShowAddParticipant(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Participante
        </Button>
      </CardHeader>
      <CardContent>
        {showAddParticipant && (
          <AddParticipantToEvent
            eventId={eventId}
            onClose={() => setShowAddParticipant(false)}
            onAdd={onUpdate}
          />
        )}

        {participants.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum participante adicionado ao evento.
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((item) => (
              <div
                key={item.participant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {item.member?.firstName} {item.member?.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.participant.role}
                    {item.participant.instrument && ` • ${item.participant.instrument}`}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeParticipant.mutate(item.participant.id)}
                  disabled={removeParticipant.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
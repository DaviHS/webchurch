"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Users, User, ChevronDown } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import type { EventParticipant } from "@/types";

const COMMON_ROLES = ["Vocalista", "Back Vocal", "Líder"];

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "erro desconhecido");

interface EventParticipantsManagerProps {
  eventId: number;
  participants: EventParticipant[];
  onUpdate: () => void;
}

export function EventParticipantsManager({ eventId, participants, onUpdate }: EventParticipantsManagerProps) {
  const [newParticipant, setNewParticipant] = useState({
    memberId: "",
    role: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const { data: membersData } = api.member.getAll.useQuery({ limit: 100 });
  const allMembers = membersData?.map((item) => item.members) ?? [];

  const addParticipantMutation = api.event.addParticipant.useMutation();
  const removeParticipantMutation = api.event.removeParticipant.useMutation();

  const handleAddParticipant = async () => {
    if (!newParticipant.memberId || !newParticipant.role) {
      toast.error("Preencha o membro e a função");
      return;
    }

    try {
      await addParticipantMutation.mutateAsync({
        eventId,
        memberId: parseInt(newParticipant.memberId),
        role: newParticipant.role,
      });

      toast.success("Participante adicionado com sucesso!");
      setNewParticipant({ memberId: "", role: "" });
      onUpdate();
    } catch (error) {
      toast.error("Erro ao adicionar participante: " + errorMessage(error));
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (confirm("Tem certeza que deseja remover este participante?")) {
      try {
        await removeParticipantMutation.mutateAsync(participantId);
        toast.success("Participante removido com sucesso!");
        onUpdate();
      } catch (error) {
        toast.error("Erro ao remover participante: " + errorMessage(error));
      }
    }
  };

  return (
    <div className="space-y-4">
      <Collapsible open={isAdding} onOpenChange={setIsAdding} className="border rounded-lg">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold">Adicionar participante</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-4">
                  <div className="md:col-span-5">
                    <Label htmlFor="member-select" className="text-sm font-medium">Membro</Label>
                    <Select 
                      value={newParticipant.memberId} 
                      onValueChange={(value) => setNewParticipant(prev => ({ ...prev, memberId: value }))}
                    >
                      <SelectTrigger id="member-select">
                        <SelectValue placeholder="Escolha um membro..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-4">
                    <Label htmlFor="role-input" className="text-sm font-medium">Função</Label>
                    <div className="relative">
                      <Input
                        id="role-input"
                        placeholder="Ex: Vocalista, Back Vocal..."
                        value={newParticipant.role}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                        list="role-suggestions"
                      />
                      <datalist id="role-suggestions">
                        {COMMON_ROLES.map((role) => (
                          <option key={role} value={role} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <Button 
                      onClick={handleAddParticipant} 
                      disabled={!newParticipant.memberId || !newParticipant.role || addParticipantMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes ({participants.length} pessoas)
            </h3>
          </div>

          {participants.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum participante adicionado"
              description="Adicione participantes usando o formulário acima."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {participant.member?.firstName} {participant.member?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{participant.role}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Remover participante"
                    aria-label="Remover participante"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
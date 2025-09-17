"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import { X, Search } from "lucide-react";
import { toast } from "sonner";

interface AddParticipantToEventProps {
  eventId: number;
  onClose: () => void;
  onAdd: () => void;
}

export function AddParticipantToEvent({ eventId, onClose, onAdd }: AddParticipantToEventProps) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [role, setRole] = useState("");
  const [instrument, setInstrument] = useState("");

  const { data: members, isLoading } = api.member.getAll.useQuery({
    search,
    limit: 10,
  });

  const addParticipant = api.event.addParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participante adicionado ao evento!");
      onAdd();
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar participante: " + error.message);
    },
  });

  const handleAddParticipant = () => {
    if (!selectedMember || !role) return;

    addParticipant.mutate({
      eventId,
      memberId: selectedMember.id,
      role,
      instrument: instrument || undefined,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Adicionar Participante</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membros..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {members && members.length > 0 && (
          <Select onValueChange={(value) => setSelectedMember(members.find(m => m.members.id === Number(value)))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.members.id} value={member.members.id.toString()}>
                  {member.members.firstName} {member.members.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedMember && (
          <>
            <Input
              placeholder="Função (ex: Vocal, Guitarra, Bateria)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <Input
              placeholder="Instrumento (opcional)"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
            />
            <Button onClick={handleAddParticipant} disabled={addParticipant.isPending}>
              {addParticipant.isPending ? "Adicionando..." : "Adicionar Participante"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
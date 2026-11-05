"use client";

import { useState } from "react";
import { Plus, Trash2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/confirm-dialog";
import { SearchInput } from "@/components/search-input";
import { fullName } from "@/lib/formatters";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { EventParticipant, RouterOutputs } from "@/types";
import { CollapsibleAddPanel } from "./collapsible-add-panel";
import { usePermissions } from "@/hooks/use-permissions";
import { SearchPickList, SelectedPick } from "./search-pick-list";

type MemberOption = RouterOutputs["member"]["list"][number]["members"];

const COMMON_ROLES = ["Vocalista", "Back Vocal", "Líder"];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

interface EventParticipantsManagerProps {
  eventId: number;
  participants: EventParticipant[];
  onUpdate: () => void;
}

export function EventParticipantsManager({ eventId, participants, onUpdate }: EventParticipantsManagerProps) {
  const { can } = usePermissions();
  const canEdit = can("events.edit");
  const confirm = useConfirm();
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [role, setRole] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const { data: membersData, isLoading: isLoadingMembers } = api.member.list.useQuery({ limit: 100 });
  const allMembers = membersData?.map((item) => item.members) ?? [];
  const searchTerm = normalize(memberSearch.trim());
  const filteredMembers = searchTerm
    ? allMembers.filter((member) => normalize(fullName(member)).includes(searchTerm))
    : allMembers;

  const addParticipantMutation = api.event.addParticipant.useMutation(
    mutationFeedback({
      success: "Participante adicionado com sucesso",
      error: "Erro ao adicionar participante",
      onSuccess: () => {
        setSelectedMember(null);
        setRole("");
        setMemberSearch("");
        onUpdate();
      },
    })
  );

  const removeParticipantMutation = api.event.removeParticipant.useMutation(
    mutationFeedback({
      success: "Participante removido com sucesso",
      error: "Erro ao remover participante",
      onSuccess: onUpdate,
    })
  );

  const trimmedRole = role.trim();

  const handleAddParticipant = () => {
    if (!selectedMember || !trimmedRole) return;
    addParticipantMutation.mutate({ eventId, memberId: selectedMember.id, role: trimmedRole });
  };

  const handleRemoveParticipant = async (participant: EventParticipant) => {
    const confirmed = await confirm({
      title: "Remover participante?",
      description: `${fullName(participant.member, "Este participante")} será removido do evento.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (confirmed) removeParticipantMutation.mutate(participant.id);
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <CollapsibleAddPanel title="Adicionar participante">
          <div className="space-y-2">
            <Label>Membro</Label>
            {selectedMember ? (
              <SelectedPick onClear={() => setSelectedMember(null)} clearLabel="Trocar membro">
                <p className="truncate font-medium">{fullName(selectedMember)}</p>
              </SelectedPick>
            ) : (
              <>
                <SearchInput value={memberSearch} onChange={setMemberSearch} placeholder="Buscar membro…" />
                <SearchPickList
                  label="Membros"
                  items={filteredMembers}
                  isLoading={isLoadingMembers}
                  getKey={(member) => member.id}
                  onSelect={setSelectedMember}
                  emptyMessage={memberSearch ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
                  renderItem={(member) => <span className="block w-full truncate font-medium">{fullName(member)}</span>}
                />
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-input">Função</Label>
            <Input
              id="role-input"
              placeholder="Ex: Vocalista, Back Vocal…"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              list="role-suggestions"
              autoComplete="off"
              enterKeyHint="done"
            />
            <datalist id="role-suggestions">
              {COMMON_ROLES.map((commonRole) => (
                <option key={commonRole} value={commonRole} />
              ))}
            </datalist>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAddParticipant}
              disabled={!selectedMember || !trimmedRole || addParticipantMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Plus />
              Adicionar
            </Button>
          </div>
        </CollapsibleAddPanel>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Users className="size-5" />
            Participantes ({participants.length} pessoas)
          </h3>

          {participants.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum participante adicionado"
              description={canEdit ? "Adicione participantes usando o formulário acima." : "Ninguém foi escalado ainda."}
              className="py-8"
            />
          ) : (
            <ul className="space-y-2">
              {participants.map((participant, index) => (
                <li key={participant.id} className="flex items-center gap-3 rounded-lg border p-2 sm:p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{fullName(participant.member)}</p>
                    <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                      <User className="size-3 shrink-0" />
                      <span className="truncate">{participant.role}</span>
                    </p>
                  </div>

                  {canEdit && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveParticipant(participant)}
                      disabled={removeParticipantMutation.isPending}
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Remover participante"
                      aria-label="Remover participante"
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

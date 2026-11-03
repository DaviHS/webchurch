"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Briefcase, Users } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useState } from "react";
import type { Ministry } from "./ministry-dialog";
import { MemberStatusBadge } from "../../members/_components/member-status-badge";

interface MinistryFunctionsDialogProps {
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryFunctionsDialog({ ministry, open, onOpenChange }: MinistryFunctionsDialogProps) {
  if (!ministry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ministério: {ministry.name}</DialogTitle>
        </DialogHeader>

        <MinistryFunctionsContent key={ministry.id} ministryId={ministry.id} />
      </DialogContent>
    </Dialog>
  );
}

function MinistryFunctionsContent({ ministryId }: { ministryId: number }) {
  const [addingFunction, setAddingFunction] = useState(false);
  const [viewMembers, setViewMembers] = useState(false);

  const utils = api.useUtils();

  const { data: ministryFunctions = [] } = api.ministry.getMinistryFunctions.useQuery({ ministryId });

  const { data: availableFunctions = [] } = api.ministry.getAvailableFunctions.useQuery(
    { ministryId },
    { enabled: addingFunction }
  );

  const { data: ministryMembers = [] } = api.ministry.getMinistryMembers.useQuery({ ministryId });

  const invalidateMinistryFunctions = () =>
    Promise.all([
      utils.ministry.getMinistryFunctions.invalidate({ ministryId }),
      utils.ministry.getAvailableFunctions.invalidate({ ministryId }),
      utils.ministry.getMinistryStats.invalidate(),
      utils.ministry.getAllMinistryFunctions.invalidate(),
    ]);

  const addFunctionMutation = api.ministry.addFunctionToMinistry.useMutation({
    onSuccess: async () => {
      toast.success("Função adicionada ao ministério com sucesso");
      setAddingFunction(false);
      await invalidateMinistryFunctions();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar função: ${error.message}`);
    },
  });

  const removeFunctionMutation = api.ministry.removeFunctionFromMinistry.useMutation({
    onSuccess: async () => {
      toast.success("Função removida do ministério com sucesso");
      await invalidateMinistryFunctions();
    },
    onError: (error) => {
      toast.error(`Erro ao remover função: ${error.message}`);
    },
  });

  const handleAddFunction = (functionId: number) => {
    addFunctionMutation.mutate({ ministryId, functionId });
  };

  const handleRemoveFunction = (relationId: number) => {
    removeFunctionMutation.mutate({ id: relationId });
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <Button
          variant="ghost"
          onClick={() => setViewMembers(false)}
          aria-pressed={!viewMembers}
          className={`-mb-px rounded-none border-b-2 ${!viewMembers ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Funções
        </Button>
        <Button
          variant="ghost"
          onClick={() => setViewMembers(true)}
          aria-pressed={viewMembers}
          className={`-mb-px rounded-none border-b-2 ${viewMembers ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          <Users className="h-4 w-4 mr-2" />
          Membros ({ministryMembers.length})
        </Button>
      </div>

      {!viewMembers ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Funções vinculadas</h3>
            {ministryFunctions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma função vinculada</p>
            ) : (
              <div className="space-y-2">
                {ministryFunctions.map((mf) => (
                  <Card key={mf.id}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div className="flex-1">
                        <span className="font-medium">{mf.functionName}</span>
                        {mf.functionDescription && (
                          <p className="text-sm text-muted-foreground">
                            {mf.functionDescription}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFunction(mf.id)}
                        disabled={removeFunctionMutation.isPending}
                        aria-label="Remover função"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Adicionar função</h3>
              <Button
                variant={addingFunction ? "default" : "outline"}
                size="sm"
                onClick={() => setAddingFunction((adding) => !adding)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addingFunction ? "Cancelar" : "Adicionar"}
              </Button>
            </div>

            {addingFunction && (
              <div className="space-y-2">
                {availableFunctions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todas as funções já estão vinculadas a este ministério
                  </p>
                ) : (
                  availableFunctions.map((func) => (
                    <Card key={func.id}>
                      <CardContent className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium">{func.name}</span>
                          {func.description && (
                            <p className="text-sm text-muted-foreground">
                              {func.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddFunction(func.id)}
                          disabled={addFunctionMutation.isPending}
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          Vincular
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">
              Membros do ministério ({ministryMembers.length})
            </h3>
            {ministryMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum membro vinculado a este ministério
              </p>
            ) : (
              <div className="space-y-2">
                {ministryMembers.map((member) => (
                  <Card key={member.memberId}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {member.firstName} {member.lastName}
                            </span>
                            <MemberStatusBadge status={member.status} />
                          </div>
                          {member.functionName && (
                            <p className="text-sm text-muted-foreground">
                              Função: {member.functionName}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
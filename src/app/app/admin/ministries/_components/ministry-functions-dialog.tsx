// app/app/admin/ministries/_components/ministry-functions-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Briefcase, Users } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface MinistryFunctionsDialogProps {
  ministry: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryFunctionsDialog({ ministry, open, onOpenChange }: MinistryFunctionsDialogProps) {
  const [addingFunction, setAddingFunction] = useState(false);
  const [viewMembers, setViewMembers] = useState(false);

  // Use useEffect para resetar estados quando o dialog abrir/fechar
  useEffect(() => {
    if (!open) {
      setAddingFunction(false);
      setViewMembers(false);
    }
  }, [open]);

  const { data: ministryFunctions = [], refetch: refetchFunctions } = api.ministry.getMinistryFunctions.useQuery(
    { ministryId: ministry?.id },
    { enabled: !!ministry && open }
  );

  const { data: availableFunctions = [] } = api.ministry.getAvailableFunctions.useQuery(
    { ministryId: ministry?.id },
    { enabled: !!ministry && open && addingFunction }
  );

  const { data: ministryMembers = [] } = api.ministry.getMinistryMembers.useQuery(
    { ministryId: ministry?.id },
    { enabled: !!ministry && open && viewMembers }
  );

  const addFunctionMutation = api.ministry.addFunctionToMinistry.useMutation({
    onSuccess: () => {
      toast.success("Função adicionada ao ministério!");
      refetchFunctions();
      setAddingFunction(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeFunctionMutation = api.ministry.removeFunctionFromMinistry.useMutation({
    onSuccess: () => {
      toast.success("Função removida do ministério!");
      refetchFunctions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddFunction = (functionId: number) => {
    addFunctionMutation.mutate({
      ministryId: ministry.id,
      functionId,
    });
  };

  const handleRemoveFunction = (relationId: number) => {
    removeFunctionMutation.mutate({ id: relationId });
  };

  if (!ministry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ministério: {ministry.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Abas para alternar entre funções e membros */}
          <div className="flex border-b">
            <Button
              variant={!viewMembers ? "default" : "ghost"}
              onClick={() => setViewMembers(false)}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Funções
            </Button>
            <Button
              variant={viewMembers ? "default" : "ghost"}
              onClick={() => setViewMembers(true)}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Membros ({ministryMembers.length})
            </Button>
          </div>

          {/* Conteúdo baseado na aba selecionada */}
          {!viewMembers ? (
            /* ABA FUNÇÕES */
            <div className="space-y-4">
              {/* Lista de funções atuais */}
              <div className="space-y-2">
                <h3 className="font-semibold">Funções Vinculadas</h3>
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
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar nova função */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Adicionar Função</h3>
                  <Button
                    variant={addingFunction ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddingFunction(!addingFunction)}
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
            /* ABA MEMBROS */
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Membros do Ministério ({ministryMembers.length})
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
                                <Badge variant="outline" className="text-xs">
                                  {member.status}
                                </Badge>
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
      </DialogContent>
    </Dialog>
  );
}
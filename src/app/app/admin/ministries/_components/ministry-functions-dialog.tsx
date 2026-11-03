"use client";

import { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, Link2, Plus, Trash2, Users, X } from "lucide-react";
import { api } from "@/trpc/react";
import { mutationFeedback } from "@/lib/mutation-feedback";
import type { Ministry } from "./ministry-dialog";
import { MinistryMemberItem } from "./ministry-member-item";

interface MinistryFunctionsDialogProps {
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryFunctionsDialog({ ministry, open, onOpenChange }: MinistryFunctionsDialogProps) {
  if (!ministry) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="min-w-0 break-words">Ministério: {ministry.name}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <MinistryFunctionsContent key={ministry.id} ministryId={ministry.id} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function MinistryFunctionsContent({ ministryId }: { ministryId: number }) {
  const [isAddingFunction, setIsAddingFunction] = useState(false);

  const utils = api.useUtils();

  const { data: ministryFunctions = [] } = api.ministry.getMinistryFunctions.useQuery({ ministryId });

  const { data: availableFunctions = [] } = api.ministry.getAvailableFunctions.useQuery(
    { ministryId },
    { enabled: isAddingFunction }
  );

  const { data: ministryMembers = [] } = api.ministry.getMinistryMembers.useQuery({ ministryId });

  const invalidateMinistryFunctions = () =>
    Promise.all([
      utils.ministry.getMinistryFunctions.invalidate({ ministryId }),
      utils.ministry.getAvailableFunctions.invalidate({ ministryId }),
      utils.ministry.getMinistryStats.invalidate(),
      utils.ministry.listMinistryFunctions.invalidate(),
    ]);

  const addFunctionMutation = api.ministry.addFunctionToMinistry.useMutation(
    mutationFeedback({
      success: "Função vinculada ao ministério com sucesso",
      error: "Erro ao vincular função",
      onSuccess: async () => {
        setIsAddingFunction(false);
        await invalidateMinistryFunctions();
      },
    })
  );

  const removeFunctionMutation = api.ministry.removeFunctionFromMinistry.useMutation(
    mutationFeedback({
      success: "Função removida do ministério com sucesso",
      error: "Erro ao remover função",
      onSuccess: invalidateMinistryFunctions,
    })
  );

  const handleAddFunction = (functionId: number) => {
    addFunctionMutation.mutate({ ministryId, functionId });
  };

  const handleRemoveFunction = (relationId: number) => {
    removeFunctionMutation.mutate({ id: relationId });
  };

  return (
    <Tabs defaultValue="functions" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-2 sm:px-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="functions" className="gap-2">
            <Briefcase className="size-4" />
            Funções
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Membros ({ministryMembers.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <ResponsiveDialogBody className="pb-4 sm:pb-6">
        <TabsContent value="functions" className="mt-2 space-y-6">
          <section className="space-y-2">
            <h3 className="font-semibold">Funções vinculadas</h3>
            {ministryFunctions.length === 0 ? (
              <EmptyState icon={Briefcase} title="Nenhuma função vinculada" className="py-6" />
            ) : (
              <div className="space-y-2">
                {ministryFunctions.map((ministryFunction) => (
                  <Card key={ministryFunction.id}>
                    <CardContent className="flex items-center justify-between gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <span className="break-words font-medium">{ministryFunction.functionName}</span>
                        {ministryFunction.functionDescription && (
                          <p className="break-words text-sm text-muted-foreground">
                            {ministryFunction.functionDescription}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFunction(ministryFunction.id)}
                        disabled={removeFunctionMutation.isPending}
                        aria-label={`Remover função ${ministryFunction.functionName}`}
                        title="Remover função"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Vincular função</h3>
              <Button
                variant={isAddingFunction ? "default" : "outline"}
                onClick={() => setIsAddingFunction((adding) => !adding)}
              >
                {isAddingFunction ? <X /> : <Plus />}
                {isAddingFunction ? "Cancelar" : "Adicionar"}
              </Button>
            </div>

            {isAddingFunction &&
              (availableFunctions.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="Todas as funções já estão vinculadas a este ministério"
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {availableFunctions.map((availableFunction) => (
                    <Card key={availableFunction.id}>
                      <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="break-words font-medium">{availableFunction.name}</span>
                          {availableFunction.description && (
                            <p className="break-words text-sm text-muted-foreground">{availableFunction.description}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddFunction(availableFunction.id)}
                          disabled={addFunctionMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <Link2 />
                          Vincular
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
          </section>
        </TabsContent>

        <TabsContent value="members" className="mt-2 space-y-2">
          <h3 className="font-semibold">Membros do ministério ({ministryMembers.length})</h3>
          {ministryMembers.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum membro vinculado a este ministério" className="py-6" />
          ) : (
            <div className="space-y-2">
              {ministryMembers.map((member) => (
                <MinistryMemberItem key={member.memberId} member={member} />
              ))}
            </div>
          )}
        </TabsContent>
      </ResponsiveDialogBody>
    </Tabs>
  );
}

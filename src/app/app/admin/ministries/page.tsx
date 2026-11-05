"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Briefcase, Settings, Eye, Pencil, Ban, Workflow, KeyRound } from "lucide-react";
import { api } from "@/trpc/react";
import { MinistryDialog, type Ministry } from "./_components/ministry-dialog";
import { FunctionDialog, type MinistryFunction } from "./_components/function-dialog";
import { MinistryFunctionsDialog } from "./_components/ministry-functions-dialog";
import { MinistryMembersDialog } from "./_components/ministry-members-dialog";
import { FunctionPermissionsDialog } from "./_components/function-permissions-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { permissionLabel } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useConfirm } from "@/components/confirm-dialog";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";

export default function MinistriesPage() {
  const [activeTab, setActiveTab] = useState("ministries");
  const [isMinistryFunctionsDialogOpen, setIsMinistryFunctionsDialogOpen] = useState(false);
  const [isMinistryMembersDialogOpen, setIsMinistryMembersDialogOpen] = useState(false);
  const [permissionsFunction, setPermissionsFunction] = useState<MinistryFunction | null>(null);
  const { can } = usePermissions();
  const canManageAccess = can("users.manage");
  const { data: functionPermissions = {} } = api.access.listFunctionPermissions.useQuery(undefined, {
    enabled: canManageAccess,
  });
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const ministryDialog = useEntityDialog<Ministry>();
  const functionDialog = useEntityDialog<MinistryFunction>();
  const confirm = useConfirm();

  const utils = api.useUtils();
  const { data: stats = [], isLoading: statsLoading } = api.ministry.getMinistryStats.useQuery();
  const { data: functions = [], isLoading: functionsLoading } = api.ministry.listFunctions.useQuery();

  const deactivateMinistryMutation = api.ministry.deactivate.useMutation(
    mutationFeedback({
      success: "Ministério desativado com sucesso",
      error: "Erro ao desativar ministério",
      onSuccess: () => Promise.all([utils.ministry.getMinistryStats.invalidate(), utils.ministry.list.invalidate()]),
    })
  );

  const deactivateFunctionMutation = api.ministry.deactivateFunction.useMutation(
    mutationFeedback({
      success: "Função desativada com sucesso",
      error: "Erro ao desativar função",
      onSuccess: () =>
        Promise.all([utils.ministry.listFunctions.invalidate(), utils.ministry.getMinistryStats.invalidate()]),
    })
  );

  const handleManageFunctions = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setIsMinistryFunctionsDialogOpen(true);
  };

  const handleViewMembers = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setIsMinistryMembersDialogOpen(true);
  };

  const handleDeactivateMinistry = async (ministry: Ministry) => {
    const confirmed = await confirm({
      title: "Desativar ministério",
      description: `Tem certeza que deseja desativar o ministério "${ministry.name}"?`,
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (confirmed) deactivateMinistryMutation.mutate({ id: ministry.id });
  };

  const handleDeactivateFunction = async (ministryFunction: MinistryFunction) => {
    const confirmed = await confirm({
      title: "Desativar função",
      description: `Tem certeza que deseja desativar a função "${ministryFunction.name}"?`,
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (confirmed) deactivateFunctionMutation.mutate({ id: ministryFunction.id });
  };

  const rowButtonClass =
    "flex min-h-10 w-full items-center justify-between rounded-md px-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground";

  return (
    <PageContainer>
      <PageHeader
        title="Ministérios e Funções"
        description="Gerencie os ministérios e funções da igreja"
        icon={Workflow}
        actions={
          activeTab === "ministries" ? (
            <Button onClick={ministryDialog.openCreate} className="w-full sm:w-auto">
              <Plus />
              Novo ministério
            </Button>
          ) : (
            <Button onClick={functionDialog.openCreate} className="w-full sm:w-auto">
              <Plus />
              Nova função
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
          <TabsTrigger value="ministries" className="flex items-center gap-2">
            <Users className="size-4" />
            Ministérios
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Briefcase className="size-4" />
            Funções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ministries" className="mt-4">
          {statsLoading ? (
            <LoadingState message="Carregando ministérios..." />
          ) : stats.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="Nenhum ministério cadastrado"
                description="Comece criando o primeiro ministério da igreja."
                action={
                  <Button onClick={ministryDialog.openCreate}>
                    <Plus />
                    Novo ministério
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map(({ ministry, memberCount, functionCount }) => (
                <Card key={ministry.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="min-w-0 break-words text-lg">{ministry.name}</CardTitle>
                      <RowActionsMenu
                        label={`Ações do ministério ${ministry.name}`}
                        className="-mr-2 -mt-2"
                        actions={[
                          { label: "Editar ministério", icon: Pencil, onSelect: () => ministryDialog.openEdit(ministry) },
                          {
                            label: "Desativar ministério",
                            icon: Ban,
                            destructive: true,
                            disabled: deactivateMinistryMutation.isPending,
                            onSelect: () => void handleDeactivateMinistry(ministry),
                          },
                        ]}
                      />
                    </div>
                    {ministry.description && (
                      <CardDescription className="line-clamp-2 break-words">{ministry.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <div className="space-y-1">
                      <button type="button" className={rowButtonClass} onClick={() => handleViewMembers(ministry)}>
                        <span className="text-muted-foreground">Membros</span>
                        <Badge variant="secondary">{memberCount}</Badge>
                      </button>
                      <button type="button" className={rowButtonClass} onClick={() => handleManageFunctions(ministry)}>
                        <span className="text-muted-foreground">Funções</span>
                        <Badge variant="secondary">{functionCount}</Badge>
                      </button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Button variant="outline" className="flex-1" onClick={() => handleViewMembers(ministry)}>
                      <Eye />
                      Membros
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleManageFunctions(ministry)}>
                      <Settings />
                      Funções
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="functions" className="mt-4">
          {functionsLoading ? (
            <LoadingState message="Carregando funções..." />
          ) : functions.length === 0 ? (
            <Card>
              <EmptyState
                icon={Briefcase}
                title="Nenhuma função cadastrada"
                description="Comece criando a primeira função."
                action={
                  <Button onClick={functionDialog.openCreate}>
                    <Plus />
                    Nova função
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {functions.map((ministryFunction) => (
                <Card key={ministryFunction.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="min-w-0 break-words text-lg">{ministryFunction.name}</CardTitle>
                      <RowActionsMenu
                        label={`Ações da função ${ministryFunction.name}`}
                        className="-mr-2 -mt-2"
                        actions={[
                          {
                            label: "Editar função",
                            icon: Pencil,
                            onSelect: () => functionDialog.openEdit(ministryFunction),
                          },
                          {
                            label: "Permissões de acesso",
                            icon: KeyRound,
                            hidden: !canManageAccess,
                            onSelect: () => setPermissionsFunction(ministryFunction),
                          },
                          {
                            label: "Desativar função",
                            icon: Ban,
                            destructive: true,
                            disabled: deactivateFunctionMutation.isPending,
                            onSelect: () => void handleDeactivateFunction(ministryFunction),
                          },
                        ]}
                      />
                    </div>
                    {ministryFunction.description && (
                      <CardDescription className="line-clamp-3 break-words">{ministryFunction.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ordem de exibição:</span>
                      <Badge variant="outline">{ministryFunction.displayOrder}</Badge>
                    </div>
                    {canManageAccess && (
                      <div className="mt-3 space-y-1.5 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground">Permissões de acesso</p>
                        <div className="flex flex-wrap gap-1">
                          {(functionPermissions[ministryFunction.id] ?? []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">Só consulta</span>
                          ) : (
                            (functionPermissions[ministryFunction.id] ?? []).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permissionLabel(permission)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MinistryDialog
        ministry={ministryDialog.editing}
        open={ministryDialog.open}
        onOpenChange={ministryDialog.onOpenChange}
      />

      <FunctionDialog
        functionItem={functionDialog.editing}
        open={functionDialog.open}
        onOpenChange={functionDialog.onOpenChange}
      />

      <MinistryFunctionsDialog
        ministry={selectedMinistry}
        open={isMinistryFunctionsDialogOpen}
        onOpenChange={setIsMinistryFunctionsDialogOpen}
      />

      <MinistryMembersDialog
        ministry={selectedMinistry}
        open={isMinistryMembersDialogOpen}
        onOpenChange={setIsMinistryMembersDialogOpen}
      />

      <FunctionPermissionsDialog
        fn={permissionsFunction}
        current={permissionsFunction ? (functionPermissions[permissionsFunction.id] ?? []) : []}
        open={permissionsFunction !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionsFunction(null);
        }}
      />
    </PageContainer>
  );
}

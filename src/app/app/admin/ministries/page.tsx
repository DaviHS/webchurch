"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Briefcase, Settings, Eye, Edit, Trash2, Workflow } from "lucide-react";
import { api } from "@/trpc/react";
import { MinistryDialog, type Ministry } from "./_components/ministry-dialog";
import { FunctionDialog, type MinistryFunction } from "./_components/function-dialog";
import { MinistryFunctionsDialog } from "./_components/ministry-functions-dialog";
import { MinistryMembersDialog } from "./_components/ministry-members-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export default function MinistriesPage() {
  const [activeTab, setActiveTab] = useState("ministries");
  const [ministryDialogOpen, setMinistryDialogOpen] = useState(false);
  const [functionDialogOpen, setFunctionDialogOpen] = useState(false);
  const [ministryFunctionsDialogOpen, setMinistryFunctionsDialogOpen] = useState(false);
  const [ministryMembersDialogOpen, setMinistryMembersDialogOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [editingFunction, setEditingFunction] = useState<MinistryFunction | null>(null);

  const utils = api.useUtils();
  const { data: stats = [], isLoading: statsLoading } = api.ministry.getMinistryStats.useQuery();
  const { data: functions = [], isLoading: functionsLoading } = api.ministry.getAllFunctions.useQuery();

  const deleteMinistryMutation = api.ministry.delete.useMutation({
    onSuccess: async () => {
      toast.success("Ministério excluído com sucesso");
      await Promise.all([utils.ministry.getMinistryStats.invalidate(), utils.ministry.getAll.invalidate()]);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ministério: ${error.message}`);
    },
  });

  const deleteFunctionMutation = api.ministry.deleteFunction.useMutation({
    onSuccess: async () => {
      toast.success("Função excluída com sucesso");
      await Promise.all([utils.ministry.getAllFunctions.invalidate(), utils.ministry.getMinistryStats.invalidate()]);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir função: ${error.message}`);
    },
  });

  const handleCreateMinistry = () => {
    setEditingMinistry(null);
    setMinistryDialogOpen(true);
  };

  const handleCreateFunction = () => {
    setEditingFunction(null);
    setFunctionDialogOpen(true);
  };

  const handleManageFunctions = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setMinistryFunctionsDialogOpen(true);
  };

  const handleViewMembers = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setMinistryMembersDialogOpen(true);
  };

  const handleEditMinistry = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setMinistryDialogOpen(true);
  };

  const handleEditFunction = (func: MinistryFunction) => {
    setEditingFunction(func);
    setFunctionDialogOpen(true);
  };

  const handleDeleteMinistry = (ministry: Ministry) => {
    if (confirm(`Tem certeza que deseja excluir o ministério "${ministry.name}"?`)) {
      deleteMinistryMutation.mutate({ id: ministry.id });
    }
  };

  const handleDeleteFunction = (func: MinistryFunction) => {
    if (confirm(`Tem certeza que deseja excluir a função "${func.name}"?`)) {
      deleteFunctionMutation.mutate({ id: func.id });
    }
  };

  const handleMinistryDialogChange = (open: boolean) => {
    setMinistryDialogOpen(open);
    if (!open) {
      void Promise.all([utils.ministry.getMinistryStats.invalidate(), utils.ministry.getAll.invalidate()]);
    }
  };

  const handleFunctionDialogChange = (open: boolean) => {
    setFunctionDialogOpen(open);
    if (!open) {
      void Promise.all([
        utils.ministry.getAllFunctions.invalidate(),
        utils.ministry.getMinistryFunctions.invalidate(),
        utils.ministry.getAvailableFunctions.invalidate(),
      ]);
    }
  };

  const rowButtonClass =
    "flex w-full items-center justify-between rounded p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground";

  return (
    <PageContainer>
      <PageHeader
        title="Ministérios e funções"
        description="Gerencie os ministérios e funções da igreja"
        icon={Workflow}
        actions={
          activeTab === "ministries" ? (
            <Button onClick={handleCreateMinistry} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo ministério
            </Button>
          ) : (
            <Button onClick={handleCreateFunction} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova função
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
          <TabsTrigger value="ministries" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ministérios
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
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
                  <Button onClick={handleCreateMinistry}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo ministério
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map(({ ministry, memberCount, functionCount }) => (
                <Card key={ministry.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{ministry.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMinistry(ministry)}
                          title="Editar ministério"
                          aria-label="Editar ministério"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMinistry(ministry)}
                          disabled={deleteMinistryMutation.isPending}
                          title="Excluir ministério"
                          aria-label="Excluir ministério"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {ministry.description && (
                      <CardDescription className="line-clamp-2">{ministry.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewMembers(ministry)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Membros
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleManageFunctions(ministry)}
                    >
                      <Settings className="mr-1 h-4 w-4" />
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
                  <Button onClick={handleCreateFunction}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova função
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {functions.map((func) => (
                <Card key={func.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{func.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFunction(func)}
                          title="Editar função"
                          aria-label="Editar função"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFunction(func)}
                          disabled={deleteFunctionMutation.isPending}
                          title="Excluir função"
                          aria-label="Excluir função"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {func.description && (
                      <CardDescription className="line-clamp-3">{func.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ordem de exibição:</span>
                      <Badge variant="outline">{func.displayOrder}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MinistryDialog
        ministry={editingMinistry}
        open={ministryDialogOpen}
        onOpenChange={handleMinistryDialogChange}
      />

      <FunctionDialog
        functionItem={editingFunction}
        open={functionDialogOpen}
        onOpenChange={handleFunctionDialogChange}
      />

      <MinistryFunctionsDialog
        ministry={selectedMinistry}
        open={ministryFunctionsDialogOpen}
        onOpenChange={setMinistryFunctionsDialogOpen}
      />

      <MinistryMembersDialog
        ministry={selectedMinistry}
        open={ministryMembersDialogOpen}
        onOpenChange={setMinistryMembersDialogOpen}
      />
    </PageContainer>
  );
}

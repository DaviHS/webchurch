// app/app/admin/ministries/page.tsx - VERSÃO CORRIGIDA E MELHORADA
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Briefcase, Settings, Eye, Edit, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { MinistryDialog } from "./_components/ministry-dialog";
import { FunctionDialog } from "./_components/function-dialog";
import { MinistryFunctionsDialog } from "./_components/ministry-functions-dialog";
import { MinistryMembersDialog } from "./_components/ministry-members-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MinistriesPage() {
  const [activeTab, setActiveTab] = useState("ministries");
  const [ministryDialogOpen, setMinistryDialogOpen] = useState(false);
  const [functionDialogOpen, setFunctionDialogOpen] = useState(false);
  const [ministryFunctionsDialogOpen, setMinistryFunctionsDialogOpen] = useState(false);
  const [ministryMembersDialogOpen, setMinistryMembersDialogOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [selectedFunction, setSelectedFunction] = useState<any>(null);

  // Queries para dados
  const { data: stats = [], isLoading: statsLoading, refetch: refetchStats } = api.ministry.getMinistryStats.useQuery();
  const { data: functions = [], isLoading: functionsLoading, refetch: refetchFunctions } = api.ministry.getAllFunctions.useQuery();

  // Mutations para soft delete
  const deleteMinistryMutation = api.ministry.delete.useMutation({
    onSuccess: () => {
      toast.success("Ministério excluído com sucesso!");
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteFunctionMutation = api.ministry.deleteFunction.useMutation({
    onSuccess: () => {
      toast.success("Função excluída com sucesso!");
      refetchFunctions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleManageFunctions = (ministry: any) => {
    setSelectedMinistry(ministry);
    setMinistryFunctionsDialogOpen(true);
  };

  const handleViewMembers = (ministry: any) => {
    setSelectedMinistry(ministry);
    setMinistryMembersDialogOpen(true);
  };

  const handleEditMinistry = (ministry: any) => {
    setSelectedMinistry(ministry);
    setMinistryDialogOpen(true);
  };

  const handleEditFunction = (func: any) => {
    setSelectedFunction(func);
    setFunctionDialogOpen(true);
  };

  const handleDeleteMinistry = (ministry: any) => {
    if (confirm(`Tem certeza que deseja excluir o ministério "${ministry.name}"?`)) {
      deleteMinistryMutation.mutate({ id: ministry.id });
    }
  };

  const handleDeleteFunction = (func: any) => {
    if (confirm(`Tem certeza que deseja excluir a função "${func.name}"?`)) {
      deleteFunctionMutation.mutate({ id: func.id });
    }
  };

  const handleDialogClose = () => {
    setMinistryDialogOpen(false);
    setFunctionDialogOpen(false);
    setSelectedMinistry(null);
    setSelectedFunction(null);
    refetchStats();
    refetchFunctions();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ministérios e Funções</h1>
            <p className="text-muted-foreground">Gerencie os ministérios e funções da igreja</p>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ministries" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ministérios
              </TabsTrigger>
              <TabsTrigger value="functions" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Funções
              </TabsTrigger>
            </TabsList>

            {/* Aba Ministérios */}
            <TabsContent value="ministries" className="space-y-4">
              <div className="flex justify-between items-center mt-4">
                <h2 className="text-lg font-semibold">Lista de Ministérios</h2>
                <Button 
                  onClick={() => setMinistryDialogOpen(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Ministério
                </Button>
              </div>

              {statsLoading ? (
                <div className="text-center py-8">Carregando ministérios...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map(({ ministry, memberCount, functionCount }) => (
                    <Card key={ministry.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{ministry.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMinistry(ministry)}
                              title="Editar ministério"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMinistry(ministry)}
                              title="Excluir ministério"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {ministry.description && (
                          <CardDescription className="line-clamp-2">
                            {ministry.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2">
                          <div 
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                            onClick={() => handleViewMembers(ministry)}
                          >
                            <span className="text-muted-foreground">Membros</span>
                            <Badge variant="secondary">{memberCount}</Badge>
                          </div>
                          <div 
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                            onClick={() => handleManageFunctions(ministry)}
                          >
                            <span className="text-muted-foreground">Funções</span>
                            <Badge variant="secondary">{functionCount}</Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewMembers(ministry)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Membros
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleManageFunctions(ministry)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Funções
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {stats.length === 0 && !statsLoading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum ministério cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando o primeiro ministério da igreja
                    </p>
                    <Button onClick={() => setMinistryDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Ministério
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Aba Funções */}
            <TabsContent value="functions" className="space-y-4">
              <div className="flex justify-between items-center mt-4">
                <h2 className="text-lg font-semibold">Lista de Funções</h2>
                <Button 
                  onClick={() => setFunctionDialogOpen(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Função
                </Button>
              </div>

              {functionsLoading ? (
                <div className="text-center py-8">Carregando funções...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {functions.map((func) => (
                    <Card key={func.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{func.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFunction(func)}
                              title="Editar função"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFunction(func)}
                              title="Excluir função"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {func.description && (
                          <CardDescription className="line-clamp-3">
                            {func.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Ordem de exibição:</span>
                          <Badge variant="outline">{func.displayOrder}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {functions.length === 0 && !functionsLoading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma função cadastrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando a primeira função
                    </p>
                    <Button onClick={() => setFunctionDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Função
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <MinistryDialog
        ministry={selectedMinistry}
        open={ministryDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <FunctionDialog
        functionItem={selectedFunction}
        open={functionDialogOpen}
        onOpenChange={handleDialogClose}
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
    </div>
  );
}
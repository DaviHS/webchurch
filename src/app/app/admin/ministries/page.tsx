// app/app/admin/ministries/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Briefcase, Settings, Eye } from "lucide-react";
import { api } from "@/trpc/react";
import { MinistryDialog } from "./_components/ministry-dialog";
import { FunctionDialog } from "./_components/function-dialog";
import { MinistryFunctionsDialog } from "./_components/ministry-functions-dialog";
import { MinistryMembersDialog } from "./_components/ministry-members-dialog";

export default function MinistriesPage() {
  const [ministryDialogOpen, setMinistryDialogOpen] = useState(false);
  const [functionDialogOpen, setFunctionDialogOpen] = useState(false);
  const [ministryFunctionsDialogOpen, setMinistryFunctionsDialogOpen] = useState(false);
  const [ministryMembersDialogOpen, setMinistryMembersDialogOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);

  const { data: stats = [], isLoading } = api.ministry.getMinistryStats.useQuery();

  const handleManageFunctions = (ministry: any) => {
    setSelectedMinistry(ministry);
    setMinistryFunctionsDialogOpen(true);
  };

  const handleViewMembers = (ministry: any) => {
    setSelectedMinistry(ministry);
    setMinistryMembersDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ministérios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie os ministérios e funções da igreja
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setFunctionDialogOpen(true)}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Funções
          </Button>
          <Button 
            onClick={() => setMinistryDialogOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Ministério
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map(({ ministry, memberCount, functionCount }) => (
            <Card key={ministry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span>{ministry.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMembers(ministry)}
                      title="Ver membros"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageFunctions(ministry)}
                      title="Gerenciar funções"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => handleViewMembers(ministry)}
                  >
                    <span className="text-muted-foreground">Membros</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{memberCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Funções</span>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{functionCount}</span>
                    </div>
                  </div>
                  {ministry.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {ministry.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

      {/* Dialogs */}
      <MinistryDialog
        open={ministryDialogOpen}
        onOpenChange={setMinistryDialogOpen}
      />

      <FunctionDialog
        open={functionDialogOpen}
        onOpenChange={setFunctionDialogOpen}
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
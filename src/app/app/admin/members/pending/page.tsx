"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export default function PendingUsersPage() {
  const utils = api.useUtils();
  const { data: pendingUsers, isLoading, refetch } = api.user.getPending.useQuery();

  const refreshPending = async () => {
    await Promise.all([refetch(), utils.user.getPendingCount.invalidate()]);
  };

  const approveMutation = api.user.approve.useMutation({
    onSuccess: async () => {
      toast.success("Usuário aprovado com sucesso");
      await refreshPending();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar usuário: ${error.message}`);
    },
  });

  const rejectMutation = api.user.reject.useMutation({
    onSuccess: async () => {
      toast.success("Acesso rejeitado com sucesso");
      await refreshPending();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar acesso: ${error.message}`);
    },
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="Aprovação de usuários"
        description="Gerencie as solicitações de acesso ao sistema"
        icon={UserCheck}
        actions={
          !isLoading && (
            <Badge variant="secondary" className="text-sm">
              <Users className="mr-1 h-4 w-4" />
              {pendingUsers?.length ?? 0} pendentes
            </Badge>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Usuários pendentes de aprovação</CardTitle>
          <CardDescription>Aprove ou rejeite solicitações de acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Carregando solicitações..." />
          ) : !pendingUsers || pendingUsers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Nenhum usuário pendente de aprovação"
              description="Novos usuários aparecerão aqui quando se registrarem."
            />
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge variant="warning">Pendente</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="truncate">
                          <span className="font-medium">Email:</span> {user.email}
                        </p>
                        {user.phone && (
                          <p>
                            <span className="font-medium">Telefone:</span> {user.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="font-medium">Registrado em:</span>{" "}
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto sm:flex-col sm:items-end">
                    <Button
                      className="flex-1 sm:w-auto sm:flex-none"
                      size="sm"
                      onClick={() => approveMutation.mutate({ id: user.id })}
                      disabled={isMutating}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      className="flex-1 sm:w-auto sm:flex-none"
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate({ id: user.id })}
                      disabled={isMutating}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

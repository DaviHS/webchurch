"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

export default function PendingUsersPage() {
  const { data: pendingUsers, isLoading, refetch } = api.user.getPending.useQuery();
  const approveMutation = api.user.approve.useMutation();
  const rejectMutation = api.user.reject.useMutation();

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync({ id: userId });
      toast.success("Usuário aprovado com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao aprovar usuário");
    }
  };

  const handleReject = async (userId: number) => {
    try {
      await rejectMutation.mutateAsync({ id: userId });
      toast.success("Acesso rejeitado");
      refetch();
    } catch (error) {
      toast.error("Erro ao rejeitar acesso");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Aprovação de Usuários</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie as solicitações de acesso ao sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {pendingUsers?.length || 0} pendentes
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Usuários Pendentes de Aprovação
          </CardTitle>
          <CardDescription>
            Aprove ou rejeite solicitações de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário pendente de aprovação</p>
              <p className="text-sm text-muted-foreground mt-1">
                Novos usuários aparecerão aqui quando se registrarem
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-semibold text-base truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Pendente
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
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
                          {new Date(user.createdAt!).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --> Container dos botões: MOBILE = linha 50/50 ; SM+ = coluna (um em cima do outro), alinhada à direita */}
                  <div className="flex w-full gap-2 sm:w-auto sm:flex-col sm:items-end">
                    <Button
                      className="flex-1 sm:flex-none sm:w-auto"
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      className="flex-1 sm:flex-none sm:w-auto"
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(user.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

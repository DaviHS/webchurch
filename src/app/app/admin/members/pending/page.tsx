"use client";

import { Check, UserCheck, Users, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import { formatDateTime, fullName } from "@/lib/formatters";
import { mutationFeedback } from "@/lib/mutation-feedback";

export default function PendingUsersPage() {
  const utils = api.useUtils();
  const confirm = useConfirm();
  const { data: pendingUsers, isLoading, refetch } = api.user.getPending.useQuery();

  const refreshPending = async () => {
    await Promise.all([refetch(), utils.user.getPendingCount.invalidate()]);
  };

  const approveUserMutation = api.user.approve.useMutation(
    mutationFeedback({
      success: (data) => (data.emailSent ? "Usuário aprovado. A pessoa foi avisada por e-mail." : "Usuário aprovado. Não foi possível avisar por e-mail: avise a pessoa."),
      error: "Erro ao aprovar usuário",
      onSuccess: refreshPending,
    })
  );

  const rejectUserMutation = api.user.reject.useMutation(
    mutationFeedback({
      success: "Acesso rejeitado com sucesso",
      error: "Erro ao rejeitar acesso",
      onSuccess: refreshPending,
    })
  );

  const isMutating = approveUserMutation.isPending || rejectUserMutation.isPending;
  const pendingTotal = pendingUsers?.length ?? 0;

  const handleReject = async (user: { id: number; email: string; firstName: string | null; lastName: string | null }) => {
    const confirmed = await confirm({
      title: "Rejeitar acesso",
      description: `A solicitação de ${fullName(user, user.email)} será rejeitada e o usuário não poderá acessar o sistema.`,
      confirmLabel: "Rejeitar",
      destructive: true,
    });
    if (confirmed) rejectUserMutation.mutate({ id: user.id });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Aprovações"
        description="Gerencie as solicitações de acesso ao sistema"
        icon={UserCheck}
        actions={
          !isLoading && (
            <Badge variant="secondary" className="w-fit text-sm">
              <Users className="mr-1 size-4" />
              {pendingTotal} {pendingTotal === 1 ? "pendente" : "pendentes"}
            </Badge>
          )
        }
      />

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Usuários pendentes de aprovação</CardTitle>
          <CardDescription>Aprove ou rejeite solicitações de acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <LoadingState message="Carregando solicitações..." />
          ) : !pendingUsers || pendingUsers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Nenhum usuário pendente de aprovação"
              description="Novos usuários aparecerão aqui quando se registrarem."
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-stretch justify-between gap-4 rounded-md border p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="min-w-0 break-words text-base font-semibold">{fullName(user, user.email)}</p>
                      <Badge variant="warning">Pendente</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="min-w-0 space-y-1">
                        <p className="break-all">
                          <span className="font-medium">Email:</span> {user.email}
                        </p>
                        {user.phone && (
                          <p>
                            <span className="font-medium">Telefone:</span>{" "}
                            <a href={`tel:${user.phone}`} className="underline-offset-4 hover:underline">
                              {user.phone}
                            </a>
                          </p>
                        )}
                      </div>
                      <p className="text-xs">
                        <span className="font-medium">Registrado em:</span> {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto sm:flex-col sm:items-stretch">
                    <Button
                      className="flex-1 sm:flex-none"
                      onClick={() => approveUserMutation.mutate({ id: user.id })}
                      disabled={isMutating}
                    >
                      <Check className="mr-1 size-4" />
                      Aprovar
                    </Button>
                    <Button
                      className="flex-1 text-destructive hover:text-destructive sm:flex-none"
                      variant="outline"
                      onClick={() => void handleReject(user)}
                      disabled={isMutating}
                    >
                      <X className="mr-1 size-4" />
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

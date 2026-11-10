"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, Check, Clock, MessageCircle, RotateCcw, UserCheck, Users, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import { formatDate, formatDateTime, fullName } from "@/lib/formatters";
import { whatsappNumber } from "@/lib/birthdays";
import { formatPhone } from "@/lib/phone";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { toastError } from "@/lib/toast";

const NO_CHOICE = "none";
const DAY_MS = 24 * 60 * 60 * 1000;

type PendingUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type Access = { ministryId?: number; functionId?: number };

function waiting(createdAt: Date, now: number) {
  const days = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / DAY_MS));
  return { days, label: days === 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias` };
}

export default function PendingUsersPage() {
  const utils = api.useUtils();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"pending" | "rejected">("pending");
  const [now] = useState(() => Date.now());
  const [selected, setSelected] = useState<number[]>([]);
  const [access, setAccess] = useState<Record<number, Access>>({});
  const reasonRef = useRef<HTMLInputElement>(null);

  const { data: pendingUsers, isLoading, refetch } = api.user.getPending.useQuery();
  const { data: rejectedUsers, isLoading: loadingRejected, refetch: refetchRejected } = api.user.getRejected.useQuery(undefined, {
    enabled: tab === "rejected",
  });
  const { data: ministries = [] } = api.ministry.list.useQuery();
  const { data: ministryFunctions = [] } = api.ministry.listMinistryFunctions.useQuery();

  const activeMinistries = ministries;

  const refreshAll = async () => {
    setSelected([]);
    await Promise.all([refetch(), refetchRejected(), utils.user.getPendingCount.invalidate(), utils.member.facets.invalidate()]);
  };

  const approveUserMutation = api.user.approve.useMutation(
    mutationFeedback({
      success: (data) => (data.emailSent ? "Usuário aprovado. A pessoa foi avisada por e-mail." : "Usuário aprovado. Não foi possível avisar por e-mail: avise a pessoa."),
      error: "Erro ao aprovar usuário",
      onSuccess: refreshAll,
    })
  );

  const rejectUserMutation = api.user.reject.useMutation(
    mutationFeedback({
      success: "Acesso rejeitado. Dá para reconsiderar na aba Rejeitadas.",
      error: "Erro ao rejeitar acesso",
      onSuccess: refreshAll,
    })
  );

  const reconsiderMutation = api.user.reconsider.useMutation(
    mutationFeedback({
      success: "Solicitação devolvida para as pendentes",
      error: "Erro ao reconsiderar",
      onSuccess: refreshAll,
    })
  );

  const [bulkRunning, setBulkRunning] = useState(false);
  const isMutating = approveUserMutation.isPending || rejectUserMutation.isPending || reconsiderMutation.isPending || bulkRunning;
  const pendingTotal = pendingUsers?.length ?? 0;
  const allSelected = pendingTotal > 0 && selected.length === pendingTotal;

  const toggle = (id: number) => setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));

  const handleApprove = async (user: PendingUser, duplicates: number) => {
    const choice = access[user.id];
    const ministry = activeMinistries.find((item) => item.id === choice?.ministryId);
    const confirmed = await confirm({
      title: "Aprovar acesso",
      description: `${fullName(user, user.email)} vai poder entrar no sistema${ministry ? ` e será vinculado(a) ao ministério ${ministry.name}` : ""}. A pessoa é avisada por e-mail.${
        duplicates > 0 ? " Atenção: existe outro cadastro parecido." : ""
      }`,
      confirmLabel: "Aprovar",
    });
    if (confirmed) approveUserMutation.mutate({ id: user.id, ministryId: choice?.ministryId, functionId: choice?.functionId });
  };

  const handleApproveSelected = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirm({
      title: `Aprovar ${selected.length} ${selected.length === 1 ? "acesso" : "acessos"}`,
      description: "Todas as pessoas selecionadas vão poder entrar no sistema e serão avisadas por e-mail.",
      confirmLabel: "Aprovar",
    });
    if (!confirmed) return;
    setBulkRunning(true);
    let failed = 0;
    for (const id of selected) {
      try {
        const choice = access[id];
        await approveUserMutation.mutateAsync({ id, ministryId: choice?.ministryId, functionId: choice?.functionId });
      } catch {
        failed += 1;
      }
    }
    setBulkRunning(false);
    if (failed > 0) toastError(`${failed} ${failed === 1 ? "aprovação falhou" : "aprovações falharam"}. Confira a lista.`);
    await refreshAll();
  };

  const handleReject = async (user: PendingUser) => {
    const confirmed = await confirm({
      title: "Rejeitar acesso",
      description: (
        <div className="space-y-3">
          <p>A solicitação de {fullName(user, user.email)} será rejeitada e a pessoa não poderá acessar o sistema. Você pode reconsiderar depois.</p>
          <Input ref={reasonRef} placeholder="Motivo (opcional, fica no histórico)" maxLength={200} />
        </div>
      ),
      confirmLabel: "Rejeitar",
      destructive: true,
    });
    const reason = reasonRef.current?.value.trim() ?? "";
    if (confirmed) rejectUserMutation.mutate({ id: user.id, reason: reason === "" ? undefined : reason });
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

      <Tabs value={tab} onValueChange={(value) => setTab(value as "pending" | "rejected")}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes{pendingTotal > 0 ? ` (${pendingTotal})` : ""}</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "pending" ? (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Usuários pendentes de aprovação</CardTitle>
            <CardDescription>Confira os dados, escolha o ministério (opcional) e aprove ou rejeite</CardDescription>
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
                {pendingUsers.length > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => setSelected(checked === true ? pendingUsers.map((user) => user.id) : [])}
                      />
                      Selecionar todas
                    </label>
                    {selected.length > 0 && (
                      <Button size="sm" onClick={() => void handleApproveSelected()} disabled={isMutating}>
                        <Check className="mr-1 size-4" />
                        Aprovar {selected.length} {selected.length === 1 ? "selecionada" : "selecionadas"}
                      </Button>
                    )}
                  </div>
                )}

                {pendingUsers.map((user) => {
                  const wait = waiting(user.createdAt, now);
                  const choice = access[user.id] ?? {};
                  const functionOptions = ministryFunctions.filter((item) => item.ministryId === choice.ministryId);
                  const whats = whatsappNumber(user.whatsapp ?? user.phone);
                  const age = user.birthDate ? formatDate(user.birthDate) : null;
                  return (
                    <div key={user.id} className="space-y-4 rounded-md border p-4">
                      <div className="flex items-start gap-3">
                        {pendingUsers.length > 1 && (
                          <Checkbox
                            className="mt-1"
                            checked={selected.includes(user.id)}
                            onCheckedChange={() => toggle(user.id)}
                            aria-label={`Selecionar ${fullName(user, user.email)}`}
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {user.memberId ? (
                              <Link
                                href={`/app/admin/members?search=${encodeURIComponent(user.email)}`}
                                className="min-w-0 break-words text-base font-semibold underline-offset-4 hover:underline"
                              >
                                {fullName(user, user.email)}
                              </Link>
                            ) : (
                              <p className="min-w-0 break-words text-base font-semibold">{fullName(user, user.email)}</p>
                            )}
                            <Badge variant="warning">Pendente</Badge>
                            <Badge variant={wait.days >= 3 ? "warning" : "outline"} className="gap-1">
                              <Clock className="size-3" />
                              {wait.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                            <p className="break-all">
                              <span className="font-medium">Email:</span> {user.email}
                            </p>
                            {user.phone && (
                              <p>
                                <span className="font-medium">Telefone:</span>{" "}
                                <a href={`tel:${user.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">
                                  {formatPhone(user.phone)}
                                </a>
                                {whats && (
                                  <a
                                    href={`https://wa.me/${whats}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                                  >
                                    <MessageCircle className="size-3.5" />
                                    WhatsApp
                                  </a>
                                )}
                              </p>
                            )}
                            {age && (
                              <p>
                                <span className="font-medium">Nascimento:</span> {age}
                              </p>
                            )}
                            {user.city && (
                              <p>
                                <span className="font-medium">Cidade:</span> {user.city}
                                {user.state ? `/${user.state}` : ""}
                              </p>
                            )}
                            {user.baptismDate && (
                              <p>
                                <span className="font-medium">Batizado(a) em:</span> {formatDate(user.baptismDate)}
                              </p>
                            )}
                            <p className="text-xs sm:col-span-2">
                              <span className="font-medium">Registrado em:</span> {formatDateTime(user.createdAt)}
                            </p>
                          </div>

                          {user.duplicates.length > 0 && (
                            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                              <p>
                                Já existe cadastro parecido:{" "}
                                {user.duplicates.map((item) => `${item.name} (${item.reason})`).join("; ")}. Confira antes de aprovar para não duplicar.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Select
                          value={choice.ministryId ? String(choice.ministryId) : NO_CHOICE}
                          onValueChange={(value) =>
                            setAccess((current) => ({ ...current, [user.id]: value === NO_CHOICE ? {} : { ministryId: Number(value) } }))
                          }
                        >
                          <SelectTrigger aria-label="Ministério ao aprovar">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_CHOICE}>Sem ministério por enquanto</SelectItem>
                            {activeMinistries.map((ministry) => (
                              <SelectItem key={ministry.id} value={String(ministry.id)}>
                                {ministry.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {choice.ministryId && functionOptions.length > 0 && (
                          <Select
                            value={choice.functionId ? String(choice.functionId) : NO_CHOICE}
                            onValueChange={(value) =>
                              setAccess((current) => ({
                                ...current,
                                [user.id]: { ministryId: choice.ministryId, functionId: value === NO_CHOICE ? undefined : Number(value) },
                              }))
                            }
                          >
                            <SelectTrigger aria-label="Função ao aprovar">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_CHOICE}>Sem função definida</SelectItem>
                              {functionOptions.map((item) => (
                                <SelectItem key={item.functionId} value={String(item.functionId)}>
                                  {item.functionName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="flex gap-2 sm:justify-end">
                        <Button
                          className="flex-1 text-destructive hover:text-destructive sm:flex-none"
                          variant="outline"
                          onClick={() => void handleReject(user)}
                          disabled={isMutating}
                        >
                          <X className="mr-1 size-4" />
                          Rejeitar
                        </Button>
                        <Button className="flex-1 sm:flex-none" onClick={() => void handleApprove(user, user.duplicates.length)} disabled={isMutating}>
                          <Check className="mr-1 size-4" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Solicitações rejeitadas</CardTitle>
            <CardDescription>Se foi engano, devolva para as pendentes e aprove</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {loadingRejected ? (
              <LoadingState message="Carregando..." />
            ) : !rejectedUsers || rejectedUsers.length === 0 ? (
              <EmptyState icon={UserCheck} title="Nenhuma solicitação rejeitada" description="O que for rejeitado aparece aqui." />
            ) : (
              <div className="space-y-3">
                {rejectedUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-sm">
                      <p className="break-words text-base font-semibold">{fullName(user, user.email)}</p>
                      <p className="break-all text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Rejeitada em {formatDateTime(user.updatedAt)}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => reconsiderMutation.mutate({ id: user.id })}
                      disabled={isMutating}
                    >
                      <RotateCcw className="mr-1 size-4" />
                      Reconsiderar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

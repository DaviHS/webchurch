"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cake, Calendar, ChevronLeft, Download, Edit, Eraser, Eye, Mail, Phone, MessageCircle, Plus, RotateCcw, UserCheck, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SearchInput } from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationBar } from "@/components/pagination-bar";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useConfirm } from "@/components/confirm-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { formatDate, fullName } from "@/lib/formatters";
import { ageOn, whatsappNumber } from "@/lib/birthdays";
import { localToday } from "@/lib/bible-plans";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { downloadJson } from "@/lib/download";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { MemberQuickViewDialog } from "./_components/member-quick-view-dialog";
import { MemberFormDialog } from "./_components/member-form-dialog";
import { MemberStatusBadge } from "./_components/member-status-badge";
import { MemberAccessStatus } from "./_components/member-access-status";
import type { MemberWithMinistries } from "./_components/types";

const PAGE_SIZE = 20;

type StatusFilter = "active" | "visiting" | "transferred" | "inactive";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "visiting", label: "Visitantes" },
  { value: "transferred", label: "Transferidos" },
  { value: "inactive", label: "Inativos" },
];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function MembersPage() {
  return (
    <Suspense>
      <MembersContent />
    </Suspense>
  );
}

function MembersContent() {
  const initialSearch = useSearchParams().get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [birthMonth, setBirthMonth] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [ministryId, setMinistryId] = useState<number | undefined>(undefined);
  const [noAccess, setNoAccess] = useState(false);
  const [today] = useState(() => localToday());
  const debouncedSearch = useDebounce(search, 500);

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<MemberWithMinistries | null>(null);
  const [formKey, setFormKey] = useState(0);
  const memberDialog = useEntityDialog<MemberWithMinistries>({ fromUrl: true });
  const confirm = useConfirm();

  const filters = {
    search: debouncedSearch || undefined,
    birthMonth,
    status: statusFilter,
    ministryId,
    hasAccess: noAccess ? ("false" as const) : undefined,
  };
  const { data: facets, refetch: refetchFacets } = api.member.facets.useQuery();
  const { data: members = [], isLoading, refetch } = api.member.list.useQuery(
    { page, limit: PAGE_SIZE, ...filters },
    { placeholderData: (previous) => previous },
  );
  const { data: total = 0 } = api.member.count.useQuery(filters, { placeholderData: (previous) => previous });
  const utils = api.useUtils();
  const refreshMembers = () => Promise.all([refetch(), utils.member.count.invalidate(), refetchFacets()]);

  const { data: pendingCount } = api.user.getPendingCount.useQuery();

  // Só aparece o filtro do que existe: situação com membros (a escolhida fica sempre) e ministério com gente.
  const visibleStatuses = STATUS_OPTIONS.filter((option) => (facets?.statuses[option.value] ?? 0) > 0 || option.value === statusFilter);
  const ministriesWithPeople = facets?.ministries ?? [];

  const deactivateMemberMutation = api.member.deactivate.useMutation(
    mutationFeedback({
      success: "Membro desativado com sucesso",
      error: "Erro ao desativar membro",
      onSuccess: () => refreshMembers(),
    })
  );

  const reactivateMemberMutation = api.member.reactivate.useMutation(
    mutationFeedback({
      success: (result) => (result.accessRestored ? "Membro reativado. O acesso ao sistema também voltou." : "Membro reativado"),
      error: "Erro ao reativar membro",
      onSuccess: () => refreshMembers(),
    })
  );

  const exportMemberMutation = api.privacy.exportMember.useMutation(
    mutationFeedback({
      loading: "Preparando os dados...",
      success: "Arquivo gerado",
      error: "Erro ao exportar os dados",
      onSuccess: (data) => downloadJson(`dados-membro-${data.member.id}.json`, data),
    })
  );

  const anonymizeMemberMutation = api.privacy.anonymizeMember.useMutation(
    mutationFeedback({
      loading: "Excluindo os dados pessoais...",
      success: "Dados pessoais excluídos",
      error: "Erro ao excluir os dados pessoais",
      onSuccess: () => refreshMembers(),
    })
  );

  const handleAnonymize = async (member: MemberWithMinistries) => {
    const confirmed = await confirm({
      title: "Excluir os dados pessoais",
      description: `Os dados de ${fullName(member)} (contatos, endereço, datas, anotações e acesso ao sistema) serão apagados e não podem ser recuperados. Ministérios, eventos e lançamentos financeiros continuam, sem identificar a pessoa. Se precisar de uma cópia, exporte os dados antes.`,
      confirmLabel: "Excluir dados",
      destructive: true,
    });
    if (confirmed) anonymizeMemberMutation.mutate({ id: member.id });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleQuickView = (member: MemberWithMinistries) => {
    setViewingMember(member);
    setQuickViewOpen(true);
  };

  const handleEdit = (member: MemberWithMinistries) => {
    setFormKey((key) => key + 1);
    setQuickViewOpen(false);
    memberDialog.openEdit(member);
  };

  const handleCreate = () => {
    setFormKey((key) => key + 1);
    memberDialog.openCreate();
  };

  const handleDeactivate = async (member: MemberWithMinistries) => {
    const confirmed = await confirm({
      title: "Desativar membro",
      description: `Tem certeza que deseja desativar ${fullName(member)}?`,
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (confirmed) deactivateMemberMutation.mutate({ id: member.id });
  };

  const handleFormOpenChange = (open: boolean) => {
    memberDialog.onOpenChange(open);
    if (!open) void refreshMembers();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Membros"
        description="Gerencie os membros da igreja"
        icon={Users}
        actions={
          <>
            {(pendingCount ?? 0) > 0 && (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/app/admin/members/pending">
                  <UserCheck className="mr-2 size-4" />
                  Aprovações
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount}
                  </Badge>
                </Link>
              </Button>
            )}
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              Novo membro
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por nome ou email..."
          isLoading={search !== debouncedSearch}
          className="sm:max-w-md"
        />
        {visibleStatuses.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Situação do membro">
          {visibleStatuses.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              className="shrink-0"
              variant={statusFilter === option.value ? "default" : "outline"}
              aria-pressed={statusFilter === option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setPage(1);
              }}
            >
              {option.label} ({facets?.statuses[option.value] ?? 0})
            </Button>
          ))}
        </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {(ministriesWithPeople.length > 0 || ministryId !== undefined) && (
          <Select
            value={ministryId ? String(ministryId) : "all"}
            onValueChange={(value) => {
              setMinistryId(value === "all" ? undefined : Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por ministério">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ministérios</SelectItem>
              {ministriesWithPeople.map((ministry) => (
                <SelectItem key={ministry.id} value={String(ministry.id)}>
                  {ministry.name} ({ministry.total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
          <Select
            value={birthMonth ? String(birthMonth) : "all"}
            onValueChange={(value) => {
              setBirthMonth(value === "all" ? undefined : Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Aniversariantes do mês">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Aniversário: todos os meses</SelectItem>
              {MONTHS.map((name, index) => (
                <SelectItem key={name} value={String(index + 1)}>
                  {name}
                  {index === new Date().getMonth() ? " (este mês)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {((facets?.noAccessCount ?? 0) > 0 || noAccess) && (
          <Button
            type="button"
            size="sm"
            variant={noAccess ? "default" : "outline"}
            aria-pressed={noAccess}
            className="sm:shrink-0"
            onClick={() => {
              setNoAccess((value) => !value);
              setPage(1);
            }}
          >
            Sem acesso ao sistema ({facets?.noAccessCount ?? 0})
          </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Carregando membros..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            statusFilter !== "active" && !debouncedSearch && !birthMonth && !ministryId && !noAccess
              ? `Nenhum membro ${statusFilter === "visiting" ? "visitante" : statusFilter === "transferred" ? "transferido" : "inativo"}`
              : birthMonth
              ? `Ninguém faz aniversário em ${MONTHS[birthMonth - 1]}`
              : debouncedSearch
              ? "Nenhum membro encontrado"
              : page > 1
                ? "Nenhum membro nesta página"
                : "Nenhum membro cadastrado"
          }
          description={debouncedSearch && !birthMonth ? "Tente buscar por outro nome ou email." : undefined}
          action={
            page > 1 ? (
              <Button variant="outline" onClick={() => setPage(1)}>
                <ChevronLeft className="mr-2 size-4" />
                Voltar à primeira página
              </Button>
            ) : statusFilter !== "active" || ministryId || noAccess ? undefined : (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 size-4" />
                Novo membro
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {members.map(({ members: m, users: u }) => (
            <Card key={m.id} className="relative cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words text-base font-semibold sm:text-lg">
                        <button
                          type="button"
                          onClick={() => handleQuickView(m)}
                          className="text-left underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {fullName(m)}
                        </button>
                      </h3>
                      <MemberStatusBadge status={m.status} />
                      {u?.status === "pending" && <Badge variant="warning">Pendente</Badge>}
                    </div>

                    <RowActionsMenu
                      label={`Ações para ${fullName(m)}`}
                      className="relative z-10 -mr-2 -mt-2"
                      actions={[
                        { label: "Ver", icon: Eye, onSelect: () => handleQuickView(m) },
                        {
                          label: "Ligar",
                          icon: Phone,
                          hidden: !m.phone,
                          onSelect: () => {
                            window.location.href = `tel:${(m.phone ?? "").replace(/[^\d+]/g, "")}`;
                          },
                        },
                        {
                          label: "WhatsApp",
                          icon: MessageCircle,
                          hidden: !whatsappNumber(m.whatsapp ?? m.phone),
                          onSelect: () => window.open(`https://wa.me/${whatsappNumber(m.whatsapp ?? m.phone)}`, "_blank", "noopener,noreferrer"),
                        },
                        { label: "Editar", icon: Edit, onSelect: () => handleEdit(m) },
                        m.status === "inactive"
                          ? {
                              label: "Reativar",
                              icon: RotateCcw,
                              disabled: reactivateMemberMutation.isPending,
                              onSelect: () => reactivateMemberMutation.mutate({ id: m.id }),
                            }
                          : {
                              label: "Desativar",
                              icon: UserX,
                              destructive: true,
                              disabled: deactivateMemberMutation.isPending,
                              onSelect: () => void handleDeactivate(m),
                            },
                        {
                          label: "Exportar dados",
                          icon: Download,
                          disabled: exportMemberMutation.isPending,
                          onSelect: () => exportMemberMutation.mutate({ id: m.id }),
                        },
                        {
                          label: "Excluir dados pessoais",
                          icon: Eraser,
                          destructive: true,
                          disabled: anonymizeMemberMutation.isPending,
                          onSelect: () => void handleAnonymize(m),
                        },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 sm:text-sm">
                    <div className="min-w-0 space-y-1">
                      {m.email && (
                        <p className="flex min-w-0 items-center gap-1.5">
                          <Mail className="size-4 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </p>
                      )}
                      {m.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="size-4 shrink-0" />
                          <span>{m.phone}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {m.birthDate && (
                        <p className={cn("flex items-center gap-1.5", birthMonth && "font-medium text-primary")}>
                          <Cake className="size-4 shrink-0" />
                          <span>
                            {birthMonth ? `Aniversário: dia ${Number(m.birthDate.slice(8, 10))}` : ""}
                            {birthMonth && ageOn(m.birthDate, today) !== null ? " · " : ""}
                            {ageOn(m.birthDate, today) !== null ? `${ageOn(m.birthDate, today)} anos` : ""}
                          </span>
                        </p>
                      )}
                      {m.memberSince && (
                        <p className="flex items-center gap-1.5">
                          <Calendar className="size-4 shrink-0" />
                          <span>Membro desde: {formatDate(m.memberSince)}</span>
                        </p>
                      )}
                      <MemberAccessStatus status={u?.status} />
                    </div>
                  </div>

                  {m.ministries.length > 0 && (
                    <div className="min-w-0">
                      <p className="text-xs font-semibold sm:text-sm">Ministérios:</p>
                      <ul className="list-inside list-disc text-xs text-muted-foreground sm:text-sm">
                        {m.ministries.slice(0, 2).map((min) => (
                          <li key={min.ministryId} className="truncate">
                            {min.ministryName}
                            {min.functionName ? ` — ${min.functionName}` : ""}
                          </li>
                        ))}
                        {m.ministries.length > 2 && (
                          <li className="text-muted-foreground/70">+{m.ministries.length - 2} mais</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <PaginationBar
          page={page}
          onPageChange={setPage}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          showing={members.length}
          itemLabel="membros"
        />
      )}

      <MemberQuickViewDialog
        member={viewingMember}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onEdit={handleEdit}
      />

      <MemberFormDialog
        key={formKey}
        member={memberDialog.editing}
        open={memberDialog.open}
        onOpenChange={handleFormOpenChange}
        mode={memberDialog.isEditing ? "edit" : "create"}
      />
    </PageContainer>
  );
}

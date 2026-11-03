"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  MoreVertical,
  Lock,
  Unlock,
  Edit,
  UserX,
  Mail,
  Phone,
  Calendar,
  Plus,
  Search,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/trpc/react";
import { QuickViewDialog } from "./_components/quick-view-dialog";
import { useCreateRequest } from "@/hooks/use-create-request";
import { MemberFormDialog } from "./_components/member-form-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { MemberStatusBadge } from "./_components/member-status-badge";
import type { MemberWithMinistries } from "./_components/types";

const PAGE_SIZE = 20;

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithMinistries | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formKey, setFormKey] = useState(0);

  const createRequest = useCreateRequest();
  const createFromUrl = createRequest.requested && !formDialogOpen;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: members = [], isLoading, refetch } = api.member.getAll.useQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const { data: pendingCount } = api.user.getPendingCount.useQuery();

  const deactivateMember = api.member.delete.useMutation({
    onSuccess: async () => {
      toast.success("Membro desativado com sucesso");
      await refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar membro: ${error.message}`);
    },
  });

  const handleQuickView = (member: MemberWithMinistries) => {
    setSelectedMember(member);
    setQuickViewOpen(true);
  };

  const handleEdit = (member: MemberWithMinistries) => {
    setSelectedMember(member);
    setFormMode("edit");
    setFormKey((key) => key + 1);
    setFormDialogOpen(true);
    setQuickViewOpen(false);
  };

  const handleNewMember = () => {
    setSelectedMember(null);
    setFormMode("create");
    setFormKey((key) => key + 1);
    setFormDialogOpen(true);
  };

  const handleDeactivate = (member: MemberWithMinistries) => {
    if (confirm(`Tem certeza que deseja desativar ${member.firstName} ${member.lastName}?`)) {
      deactivateMember.mutate({ id: member.id });
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    if (open) return;
    setFormDialogOpen(false);
    createRequest.dismiss();
    setSelectedMember(null);
    void refetch();
  };

  const showPagination = !isLoading && (page > 1 || members.length === PAGE_SIZE);

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
                  <UserCheck className="mr-2 h-4 w-4" />
                  Aprovações
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount}
                  </Badge>
                </Link>
              </Button>
            )}
            <Button onClick={handleNewMember} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo membro
            </Button>
          </>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Carregando membros..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            debouncedSearch
              ? "Nenhum membro encontrado"
              : page > 1
                ? "Nenhum membro nesta página"
                : "Nenhum membro cadastrado"
          }
          description={debouncedSearch ? "Tente buscar por outro nome ou email." : undefined}
          action={
            page > 1 ? (
              <Button variant="outline" onClick={() => setPage(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar à primeira página
              </Button>
            ) : (
              <Button onClick={handleNewMember}>
                <Plus className="mr-2 h-4 w-4" />
                Novo membro
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {members.map(({ members: m, users: u }) => (
            <Card key={m.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold sm:text-lg">
                        {m.firstName} {m.lastName}
                      </h3>
                      <MemberStatusBadge status={m.status} />
                      {u?.status === "pending" && <Badge variant="warning">Pendente</Badge>}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickView(m)}
                        aria-label="Ver membro"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Mais ações"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleQuickView(m)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(m)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(m)}
                            disabled={deactivateMember.isPending}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 sm:text-sm">
                    <div className="space-y-1">
                      {m.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{m.email}</span>
                        </p>
                      )}
                      {m.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{m.phone}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {m.memberSince && (
                        <p className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Membro desde: {new Date(m.memberSince).toLocaleDateString("pt-BR")}
                          </span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        {u?.status === "active" ? (
                          <Unlock className="h-4 w-4 text-success" />
                        ) : u?.status === "pending" ? (
                          <Users className="h-4 w-4 text-warning" />
                        ) : (
                          <Lock className="h-4 w-4 text-destructive" />
                        )}
                        <span>
                          {u
                            ? u.status === "active"
                              ? "Acesso ativo"
                              : u.status === "pending"
                                ? "Aguardando aprovação"
                                : "Acesso inativo"
                            : "Sem acesso"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {m.ministries.length > 0 && (
                    <div>
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

      {showPagination && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={members.length < PAGE_SIZE}
          >
            Próxima
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      <QuickViewDialog
        member={selectedMember}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onEdit={handleEdit}
      />

      <MemberFormDialog
        key={formKey}
        member={createFromUrl ? null : selectedMember}
        open={formDialogOpen || createFromUrl}
        onOpenChange={handleFormOpenChange}
        mode={createFromUrl ? "create" : formMode}
      />
    </PageContainer>
  );
}

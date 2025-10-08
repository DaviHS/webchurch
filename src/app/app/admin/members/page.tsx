"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreVertical, Lock, Unlock, Edit, UserX, Mail, Phone, Calendar, Plus, Search, Users, UserCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { api } from "@/trpc/react";
import { QuickViewDialog } from "./_components/quick-view-dialog";
import { MemberFormDialog } from "./_components/member-form-dialog";
import { toast } from "sonner";
import Link from "next/link";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: membersData = [], isLoading, refetch } = api.member.getAll.useQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const { data: pendingCount } = api.user.getPendingCount.useQuery();

  const deactivateMember = api.member.delete.useMutation({
    onSuccess: () => {
      toast.success("Membro desativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Extrair membros do formato correto
  const members = Array.isArray(membersData) ? membersData : [];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      visiting: "bg-blue-100 text-blue-800 border-blue-200",
      transferred: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      visiting: "Visitante",
      transferred: "Transferido",
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleQuickView = (member: any) => {
    setSelectedMember(member);
    setQuickViewOpen(true);
  };

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setFormMode("edit");
    setFormDialogOpen(true);
    setQuickViewOpen(false);
  };

  const handleNewMember = () => {
    setSelectedMember(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleDeactivate = async (member: any) => {
    if (confirm(`Tem certeza que deseja desativar ${member.firstName} ${member.lastName}?`)) {
      try {
        await deactivateMember.mutateAsync({ id: member.id });
      } catch (error) {
      }
    }
  };

  const handleDialogClose = () => {
    setFormDialogOpen(false);
    setSelectedMember(null);
    refetch();
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Membros</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie os membros da igreja
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {pendingCount && pendingCount > 0 && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/app/admin/members/pending" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <Badge variant="destructive" className="ml-1">
                  {pendingCount}
                </Badge>
              </Link>
            </Button>
          )}
          
          <Button 
            onClick={handleNewMember} 
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando membros...</div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {members.map(({ members: m, users: u }) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {m.firstName} {m.lastName}
                      </h3>
                      {getStatusBadge(m.status)}
                      {u && u.status === "pending" && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pendente
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickView(m)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleQuickView(m)}>
                            <Eye className="h-4 w-4 mr-2 text-green-600" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(m)}>
                            <Edit className="h-4 w-4 mr-2 text-blue-600" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(m)}
                            disabled={deactivateMember.isPending}
                          >
                            <UserX className="h-4 w-4 mr-2 text-red-600" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="space-y-1">
                      {m.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{m.email}</span>
                        </p>
                      )}
                      {m.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{m.phone}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {m.memberSince && (
                        <p className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Membro desde:{" "}
                            {new Date(m.memberSince).toLocaleDateString("pt-BR")}
                          </span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        {u ? (
                          u.status === "active" ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : u.status === "pending" ? (
                            <Users className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600" />
                          )
                        ) : (
                          <Lock className="h-4 w-4 text-red-600" />
                        )}
                        <span>
                          {u ? 
                            u.status === "active" ? "Acesso ativo" :
                            u.status === "pending" ? "Aguardando aprovação" :
                            "Acesso inativo" 
                          : "Sem acesso"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {m.ministries && m.ministries.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">Ministérios:</p>
                      <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground">
                        {m.ministries.slice(0, 2).map(
                          (
                            min: { ministryName: string; functionName: string | null },
                            idx: number
                          ) => (
                            <li key={idx} className="truncate">
                              {min.ministryName}
                              {min.functionName ? ` — ${min.functionName}` : ""}
                            </li>
                          )
                        )}
                        {m.ministries.length > 2 && (
                          <li className="text-muted-foreground/70">
                            +{m.ministries.length - 2} mais
                          </li>
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

      {members.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {debouncedSearch ? "Nenhum membro encontrado para sua busca" : "Nenhum membro cadastrado"}
          </p>
          <Button onClick={handleNewMember} className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {debouncedSearch ? "Cadastrar Novo Membro" : "Adicionar Primeiro Membro"}
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
        member={selectedMember}
        open={formDialogOpen}
        onOpenChange={handleDialogClose}
        mode={formMode}
      />
    </div>
  );
}
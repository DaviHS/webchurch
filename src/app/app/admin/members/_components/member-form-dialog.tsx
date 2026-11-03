"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberFormData, type MemberFormInput } from "@/validators/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Save, X, Plus, Loader2, Trash2, UserPlus, Eye, EyeOff, ChevronLeft, ChevronRight, Key, User, Check } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { DEFAULT_PASSWORD } from "@/lib/default-password";
import type { MemberWithMinistries } from "./types";

interface MemberFormDialogProps {
  member?: MemberWithMinistries | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

type TabValue = "personal" | "address" | "church" | "ministries" | "access";
type Gender = NonNullable<MemberFormInput["gender"]>;
type MaritalStatus = NonNullable<MemberFormInput["maritalStatus"]>;
type MemberStatus = NonNullable<MemberFormInput["status"]>;

interface MinistryFunctionOption {
  functionId: number;
  functionName: string;
}

const tabs: TabValue[] = ["personal", "address", "church", "ministries", "access"];

const NO_FUNCTION = "none";

type UserAccessStatus = "active" | "pending" | "inactive";

const USER_ACCESS_STATUS: Record<
  UserAccessStatus,
  { title: string; label: string; variant: BadgeProps["variant"]; boxClassName: string }
> = {
  active: { title: "Usuário ativo", label: "Ativo", variant: "success", boxClassName: "border-success/30 bg-success/10 text-success" },
  pending: { title: "Aguardando aprovação", label: "Pendente", variant: "warning", boxClassName: "border-warning/30 bg-warning/10 text-warning" },
  inactive: { title: "Usuário inativo", label: "Inativo", variant: "destructive", boxClassName: "border-destructive/30 bg-destructive/10 text-destructive" },
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultValues(member: MemberWithMinistries | null | undefined): MemberFormInput {
  if (!member) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      whatsapp: "",
      birthDate: "",
      gender: "male",
      maritalStatus: "single",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      profession: "",
      emergencyContact: "",
      emergencyPhone: "",
      baptismDate: "",
      memberSince: todayIsoDate(),
      status: "active",
      notes: "",
      baptized: false,
      ministries: [],
    };
  }

  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email ?? "",
    phone: member.phone ?? "",
    whatsapp: member.whatsapp ?? "",
    birthDate: member.birthDate ?? "",
    gender: member.gender ?? "male",
    maritalStatus: member.maritalStatus ?? "single",
    address: member.address ?? "",
    city: member.city ?? "",
    state: member.state ?? "",
    zipCode: member.zipCode ?? "",
    profession: member.profession ?? "",
    emergencyContact: member.emergencyContact ?? "",
    emergencyPhone: member.emergencyPhone ?? "",
    baptismDate: member.baptismDate ?? "",
    memberSince: member.memberSince ?? todayIsoDate(),
    status: member.status,
    notes: member.notes ?? "",
    baptized: Boolean(member.baptismDate),
    ministries: member.ministries.map((min) => ({
      ministryId: min.ministryId,
      functionId: min.functionId ?? undefined,
    })),
  };
}

export function MemberFormDialog({ member, open, onOpenChange, mode }: MemberFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [defaultValues] = useState(() => buildDefaultValues(mode === "edit" ? member : null));

  const memberId = mode === "edit" ? member?.id : undefined;
  const utils = api.useUtils();

  const { data: ministries = [] } = api.ministry.getAll.useQuery(undefined, {
    enabled: open,
  });

  const { data: allMinistryFunctions = [] } = api.ministry.getAllMinistryFunctions.useQuery(undefined, {
    enabled: open,
  });

  const { data: existingUser } = api.user.getByMemberId.useQuery(
    { memberId: memberId ?? 0 },
    { enabled: open && memberId !== undefined }
  );

  const functionsByMinistry = useMemo(() => {
    const map = new Map<number, MinistryFunctionOption[]>();

    for (const mf of allMinistryFunctions) {
      const list = map.get(mf.ministryId) ?? [];
      list.push({ functionId: mf.functionId, functionName: mf.functionName });
      map.set(mf.ministryId, list);
    }

    return map;
  }, [allMinistryFunctions]);

  const form = useForm<MemberFormInput, unknown, MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ministries",
  });

  const [email, gender, maritalStatus, status, watchedMinistries] = useWatch({
    control: form.control,
    name: ["email", "gender", "maritalStatus", "status", "ministries"],
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      void utils.user.getByMemberId.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const createMember = api.member.create.useMutation({
    onSuccess: (newMember) => {
      toast.success("Membro criado com sucesso");

      if (createUser && newMember?.email) {
        createUserMutation.mutate({
          memberId: newMember.id,
          email: newMember.email,
          password: DEFAULT_PASSWORD,
        });
      } else {
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao criar membro: ${error.message}`);
    },
  });

  const updateMember = api.member.update.useMutation({
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar membro: ${error.message}`);
    },
  });

  const updateUserMutation = api.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.getByMemberId.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const onSubmit = (data: MemberFormData) => {
    const submitData = {
      ...data,
      ministries: data.ministries.filter((ministry) => ministry.ministryId > 0),
    };

    if (memberId === undefined) {
      createMember.mutate(submitData);
    } else {
      updateMember.mutate({ id: memberId, data: submitData });
    }
  };

  const handleCreateUserAccess = () => {
    if (memberId === undefined) return;
    if (!email) {
      toast.error("O membro precisa ter um email para criar acesso");
      return;
    }

    createUserMutation.mutate({ memberId, email, password: DEFAULT_PASSWORD });
  };

  const handleResetPassword = () => {
    if (!existingUser) return;

    updateUserMutation.mutate(
      { id: existingUser.id, password: DEFAULT_PASSWORD },
      { onSuccess: () => toast.success(`Senha resetada para ${DEFAULT_PASSWORD}`) }
    );
  };

  const handleChangeUserStatus = (userId: number, nextStatus: "active" | "inactive") => {
    updateUserMutation.mutate(
      { id: userId, status: nextStatus },
      { onSuccess: () => toast.success("Usuário atualizado com sucesso") }
    );
  };

  const isLoading = createMember.isPending || updateMember.isPending || createUserMutation.isPending || updateUserMutation.isPending;

  const getFunctionsForMinistry = (ministryId: number) => functionsByMinistry.get(ministryId) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Novo membro" : `Editar ${defaultValues.firstName} ${defaultValues.lastName}`}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {mode === "create" 
              ? "Preencha as informações do novo membro" 
              : "Atualize as informações do membro"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto py-2 gap-1">
            <TabsTrigger value="personal" className="text-xs sm:text-sm py-2 h-auto">
              Pessoal
            </TabsTrigger>
            <TabsTrigger value="address" className="text-xs sm:text-sm py-2 h-auto">
              Endereço
            </TabsTrigger>
            <TabsTrigger value="church" className="text-xs sm:text-sm py-2 h-auto">
              Igreja
            </TabsTrigger>
            <TabsTrigger value="ministries" className="text-xs sm:text-sm py-2 h-auto">
              Ministérios
            </TabsTrigger>
            <TabsTrigger value="access" className="text-xs sm:text-sm py-2 h-auto">
              Acesso
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <TabsContent value="personal" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações pessoais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm">Nome *</Label>
                    <Input 
                      id="firstName" 
                      {...form.register("firstName")} 
                      className="text-sm sm:text-base"
                      placeholder="Digite o nome"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm">Sobrenome *</Label>
                    <Input 
                      id="lastName" 
                      {...form.register("lastName")} 
                      className="text-sm sm:text-base"
                      placeholder="Digite o sobrenome"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...form.register("email")} 
                        className="text-sm sm:text-base"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Telefone</Label>
                      <Input 
                        id="phone" 
                        {...form.register("phone")} 
                        className="text-sm sm:text-base"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-sm">Data de nascimento</Label>
                      <Input 
                        id="birthDate" 
                        type="date" 
                        {...form.register("birthDate")} 
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-sm">WhatsApp</Label>
                      <Input 
                        id="whatsapp" 
                        {...form.register("whatsapp")} 
                        className="text-sm sm:text-base"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Gênero</Label>
                      <Select
                        value={gender ?? "male"}
                        onValueChange={(value) => form.setValue("gender", value as Gender)}
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Estado civil</Label>
                      <Select
                        value={maritalStatus ?? "single"}
                        onValueChange={(value) =>
                          form.setValue("maritalStatus", value as MaritalStatus)
                        }
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Solteiro(a)</SelectItem>
                          <SelectItem value="married">Casado(a)</SelectItem>
                          <SelectItem value="divorced">Divorciado(a)</SelectItem>
                          <SelectItem value="widowed">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession" className="text-sm">Profissão</Label>
                    <Input 
                      id="profession" 
                      {...form.register("profession")} 
                      className="text-sm sm:text-base"
                      placeholder="Digite a profissão"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contato de emergência</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-sm">Nome do contato</Label>
                    <Input 
                      id="emergencyContact" 
                      {...form.register("emergencyContact")} 
                      className="text-sm sm:text-base"
                      placeholder="Nome do contato de emergência"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-sm">Telefone de emergência</Label>
                    <Input 
                      id="emergencyPhone" 
                      {...form.register("emergencyPhone")} 
                      className="text-sm sm:text-base"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm">Endereço completo</Label>
                    <Textarea 
                      id="address" 
                      {...form.register("address")} 
                      rows={3} 
                      className="text-sm sm:text-base"
                      placeholder="Rua, número, bairro..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm">Cidade</Label>
                      <Input 
                        id="city" 
                        {...form.register("city")} 
                        className="text-sm sm:text-base"
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm">Estado</Label>
                      <Input 
                        id="state" 
                        {...form.register("state")} 
                        maxLength={2} 
                        className="text-sm sm:text-base"
                        placeholder="SP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm">CEP</Label>
                      <Input 
                        id="zipCode" 
                        {...form.register("zipCode")} 
                        className="text-sm sm:text-base"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="church" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações da igreja</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberSince" className="text-sm">Membro desde</Label>
                    <Input 
                      id="memberSince" 
                      type="date" 
                      {...form.register("memberSince")} 
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baptismDate" className="text-sm">Data do batismo</Label>
                    <Input 
                      id="baptismDate" 
                      type="date" 
                      {...form.register("baptismDate")} 
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Status</Label>
                    <Select
                      value={status ?? "active"}
                      onValueChange={(value) =>
                        form.setValue("status", value as MemberStatus)
                      }
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="visiting">Visitante</SelectItem>
                        <SelectItem value="transferred">Transferido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex items-center">
                    <input
                      type="checkbox"
                      id="baptized"
                      {...form.register("baptized")}
                      className="mr-2 h-4 w-4 accent-primary"
                    />
                    <Label htmlFor="baptized" className="text-sm">Batizado</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm">Observações adicionais</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Observações sobre o membro"
                      rows={4}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ministries" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-lg">Ministérios</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ ministryId: 0, functionId: undefined })}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar ministério
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.map((field, index) => {
                    const selectedMinistryId = watchedMinistries?.[index]?.ministryId ?? 0;
                    const selectedFunctionId = watchedMinistries?.[index]?.functionId;
                    const ministryFunctions = getFunctionsForMinistry(selectedMinistryId);

                    return (
                      <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          <div className="space-y-2">
                            <Label className="text-sm">Ministério</Label>
                            <Select
                              value={String(selectedMinistryId)}
                              onValueChange={(value) => {
                                const ministryId = Number(value);
                                form.setValue(`ministries.${index}.ministryId`, ministryId);
                                form.setValue(`ministries.${index}.functionId`, undefined);
                              }}
                            >
                              <SelectTrigger className="text-sm sm:text-base">
                                <SelectValue placeholder="Selecione o ministério" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Selecione um ministério</SelectItem>
                                {ministries.map((ministry) => (
                                  <SelectItem key={ministry.id} value={ministry.id.toString()}>
                                    {ministry.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Função</Label>
                            <Select
                              value={selectedFunctionId == null ? "" : String(selectedFunctionId)}
                              onValueChange={(value) =>
                                form.setValue(
                                  `ministries.${index}.functionId`,
                                  value === NO_FUNCTION ? undefined : Number(value)
                                )
                              }
                              disabled={selectedMinistryId === 0}
                            >
                              <SelectTrigger className="text-sm sm:text-base">
                                <SelectValue placeholder={
                                  ministryFunctions.length === 0 ? "Sem funções disponíveis" : "Selecione a função"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_FUNCTION}>Sem função específica</SelectItem>
                                {ministryFunctions.map((mf) => (
                                  <SelectItem key={mf.functionId} value={mf.functionId.toString()}>
                                    {mf.functionName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="mt-2 w-full text-destructive hover:text-destructive sm:mt-0 sm:w-auto"
                          aria-label="Remover ministério"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhum ministério adicionado</p>
                      <p className="text-xs">Clique em &ldquo;Adicionar ministério&rdquo; para incluir</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Acesso ao sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === "create" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Criar usuário para acesso</Label>
                          <p className="text-xs text-muted-foreground">
                            O membro poderá acessar o sistema com o email cadastrado
                          </p>
                        </div>
                        <Switch
                          checked={createUser}
                          onCheckedChange={setCreateUser}
                        />
                      </div>

                      {createUser && (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                          <div className="space-y-2">
                            <Label className="text-sm">Email para acesso</Label>
                            <Input 
                              value={email ?? ""}
                              disabled 
                              className="text-sm sm:text-base bg-background"
                            />
                            <p className="text-xs text-muted-foreground">
                              Será usado o email cadastrado nas informações pessoais
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Senha inicial</Label>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                value={DEFAULT_PASSWORD} 
                                disabled 
                                className="text-sm sm:text-base bg-background"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              O usuário receberá esta senha inicial e poderá alterá-la depois
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {existingUser ? (
                        <div className="space-y-4">
                          <div className={`rounded-lg border p-4 ${USER_ACCESS_STATUS[existingUser.status].boxClassName}`}>
                            <div className="mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{USER_ACCESS_STATUS[existingUser.status].title}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 text-sm text-foreground sm:grid-cols-2">
                              <div>
                                <Label className="text-xs">Email de acesso</Label>
                                <p className="font-medium">{existingUser.email}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Status</Label>
                                <div className="mt-1">
                                  <Badge variant={USER_ACCESS_STATUS[existingUser.status].variant}>
                                    {USER_ACCESS_STATUS[existingUser.status].label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleResetPassword}
                              disabled={updateUserMutation.isPending}
                              className="flex-1"
                            >
                              <Key className="h-4 w-4 mr-2" />
                              {updateUserMutation.isPending ? "Resetando..." : "Resetar senha"}
                            </Button>

                            {existingUser.status === "pending" ? (
                              <Button
                                type="button"
                                onClick={() => handleChangeUserStatus(existingUser.id, "active")}
                                disabled={updateUserMutation.isPending}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Aprovar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  handleChangeUserStatus(
                                    existingUser.id,
                                    existingUser.status === "active" ? "inactive" : "active"
                                  )
                                }
                                disabled={updateUserMutation.isPending}
                                className="flex-1"
                              >
                                {existingUser.status === "active" ? "Desativar acesso" : "Ativar acesso"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                            <div className="mb-2 flex items-center gap-2 text-warning">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Sem acesso ao sistema</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Este membro ainda não possui uma conta de acesso ao sistema.
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={handleCreateUserAccess}
                            disabled={createUserMutation.isPending || !email}
                            className="w-full"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {createUserMutation.isPending ? "Criando..." : "Criar acesso para este membro"}
                          </Button>

                          {!email && (
                            <p className="text-xs text-destructive text-center">
                              É necessário ter um email cadastrado para criar o acesso
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = tabs.indexOf(activeTab);
                    const prevTab = tabs[currentIndex - 1];
                    if (prevTab) setActiveTab(prevTab);
                  }}
                  disabled={activeTab === "personal"}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = tabs.indexOf(activeTab);
                    const nextTab = tabs[currentIndex + 1];
                    if (nextTab) setActiveTab(nextTab);
                  }}
                  disabled={activeTab === "access"}
                  className="flex-1 sm:flex-none"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="sm:inline">Cancelar</span>
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">
                    {mode === "create" ? "Criar membro" : "Salvar"}
                  </span>
                  <span className="sm:hidden">
                    {mode === "create" ? "Criar" : "Salvar"}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
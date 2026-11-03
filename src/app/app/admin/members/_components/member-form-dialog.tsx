"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useForm, useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Key, Loader2, Plus, Save, Trash2, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { memberSchema, type MemberFormData, type MemberFormInput } from "@/validators/member";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PasswordInput } from "@/components/password-input";
import { useConfirm } from "@/components/confirm-dialog";
import { api } from "@/trpc/react";
import { DEFAULT_PASSWORD } from "@/lib/default-password";
import { fullName } from "@/lib/formatters";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import type { MemberStatus, MemberWithMinistries } from "./types";

interface MemberFormDialogProps {
  member?: MemberWithMinistries | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

type TabValue = "personal" | "address" | "church" | "ministries" | "access";
type Gender = NonNullable<MemberFormInput["gender"]>;
type MaritalStatus = NonNullable<MemberFormInput["maritalStatus"]>;
type UserAccessStatus = "active" | "pending" | "inactive";

const TABS: { value: TabValue; label: string }[] = [
  { value: "personal", label: "Pessoal" },
  { value: "address", label: "Endereço" },
  { value: "church", label: "Igreja" },
  { value: "ministries", label: "Ministérios" },
  { value: "access", label: "Acesso" },
];

const FIELD_TABS: Partial<Record<keyof MemberFormInput, TabValue>> = {
  address: "address",
  city: "address",
  state: "address",
  zipCode: "address",
  memberSince: "church",
  baptismDate: "church",
  status: "church",
  notes: "church",
  ministries: "ministries",
};

const NO_FUNCTION = "none";

const USER_ACCESS_STATUS: Record<
  UserAccessStatus,
  { title: string; label: string; variant: BadgeProps["variant"]; boxClassName: string }
> = {
  active: { title: "Usuário ativo", label: "Ativo", variant: "success", boxClassName: "border-success/30 bg-success/10 text-success" },
  pending: { title: "Aguardando aprovação", label: "Pendente", variant: "warning", boxClassName: "border-warning/30 bg-warning/10 text-warning" },
  inactive: { title: "Usuário inativo", label: "Inativo", variant: "destructive", boxClassName: "border-destructive/30 bg-destructive/10 text-destructive" },
};

const STATUS_SUCCESS: Record<"active" | "inactive", string> = {
  active: "Acesso ativado com sucesso",
  inactive: "Acesso desativado com sucesso",
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

function FormSection({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function MemberFormDialog({ member, open, onOpenChange, mode: requestedMode }: MemberFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("personal");
  const [createUser, setCreateUser] = useState(false);
  const [mode] = useState(requestedMode);
  const [memberId] = useState(() => (requestedMode === "edit" ? member?.id : undefined));
  const [defaultValues] = useState(() => buildDefaultValues(requestedMode === "edit" ? member : null));
  const confirm = useConfirm();
  const utils = api.useUtils();
  const { data: session } = useSession();
  const isSessionAdmin = session?.user.isAdmin === true;

  const { data: ministries = [] } = api.ministry.list.useQuery(undefined, {
    enabled: open,
  });

  const { data: allMinistryFunctions = [] } = api.ministry.listMinistryFunctions.useQuery(undefined, {
    enabled: open,
  });

  const { data: existingUser } = api.user.getByMemberId.useQuery(
    { memberId: memberId ?? 0 },
    { enabled: open && memberId !== undefined }
  );

  const functionsByMinistry = useMemo(() => {
    const map = new Map<number, { functionId: number; functionName: string }[]>();

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

  const { errors } = form.formState;

  const createUserMutation = api.user.create.useMutation(
    mutationFeedback({
      success: "Usuário criado com sucesso",
      error: "Erro ao criar usuário",
      onSuccess: () => {
        void utils.user.getByMemberId.invalidate();
        onOpenChange(false);
      },
    })
  );

  const createMemberMutation = api.member.create.useMutation(
    mutationFeedback({
      success: "Membro criado com sucesso",
      error: "Erro ao criar membro",
      onSuccess: (newMember) => {
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
    })
  );

  const updateMemberMutation = api.member.update.useMutation(
    mutationFeedback({
      success: "Membro atualizado com sucesso",
      error: "Erro ao atualizar membro",
      onSuccess: () => onOpenChange(false),
    })
  );

  const updateUserMutation = api.user.update.useMutation(
    mutationFeedback({
      error: "Erro ao atualizar usuário",
      onSuccess: () => utils.user.getByMemberId.invalidate(),
    })
  );

  const updateUserAdminMutation = api.user.update.useMutation(
    mutationFeedback({
      success: (user) =>
        user.isAdmin ? "Acesso de administrador concedido com sucesso" : "Acesso de administrador removido com sucesso",
      error: "Erro ao alterar acesso de administrador",
      onSuccess: () => utils.user.getByMemberId.invalidate(),
    })
  );

  const handleChangeUserAdmin = async (userId: number, isAdmin: boolean) => {
    if (isAdmin) {
      const confirmed = await confirm({
        title: "Dar acesso de administrador?",
        description: "O usuário poderá ver e alterar as finanças da igreja.",
        confirmLabel: "Dar acesso",
      });
      if (!confirmed) return;
    }

    updateUserAdminMutation.mutate({ id: userId, isAdmin });
  };

  const handleSubmit = (data: MemberFormData) => {
    const submitData = {
      ...data,
      ministries: data.ministries.filter((ministry) => ministry.ministryId > 0),
    };

    if (memberId === undefined) {
      createMemberMutation.mutate(submitData);
    } else {
      updateMemberMutation.mutate({ id: memberId, data: submitData });
    }
  };

  const handleInvalid = (formErrors: FieldErrors<MemberFormInput>) => {
    const firstField = Object.keys(formErrors)[0] as keyof MemberFormInput | undefined;
    if (!firstField) return;
    setActiveTab(FIELD_TABS[firstField] ?? "personal");
    toast.error("Revise os campos destacados antes de salvar");
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
      { onSuccess: () => toast.success(`Senha redefinida para ${DEFAULT_PASSWORD}`) }
    );
  };

  const handleChangeUserStatus = async (userId: number, nextStatus: "active" | "inactive") => {
    if (nextStatus === "inactive") {
      const confirmed = await confirm({
        title: "Desativar acesso",
        description: "O usuário deixará de conseguir entrar no sistema até que o acesso seja ativado novamente.",
        confirmLabel: "Desativar acesso",
        destructive: true,
      });
      if (!confirmed) return;
    }

    updateUserMutation.mutate(
      { id: userId, status: nextStatus },
      { onSuccess: () => toast.success(STATUS_SUCCESS[nextStatus]) }
    );
  };

  const handleApproveUser = (userId: number) => {
    updateUserMutation.mutate(
      { id: userId, status: "active" },
      { onSuccess: () => toast.success("Usuário aprovado com sucesso") }
    );
  };

  const isSaving =
    createMemberMutation.isPending ||
    updateMemberMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;

  const activeIndex = TABS.findIndex((tab) => tab.value === activeTab);
  const previousTab = TABS[activeIndex - 1];
  const nextTab = TABS[activeIndex + 1];

  const getFunctionsForMinistry = (ministryId: number) => functionsByMinistry.get(ministryId) ?? [];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="break-words">
              {mode === "create" ? "Novo membro" : `Editar ${fullName(defaultValues)}`}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {mode === "create" ? "Preencha as informações do novo membro" : "Atualize as informações do membro"}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="shrink-0 space-y-1 px-4 pb-2 sm:px-6">
            <TabsList className="flex h-auto w-full snap-x justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-h-9 shrink-0 snap-start px-4 sm:min-h-7 sm:flex-1"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Passo {activeIndex + 1} de {TABS.length}
            </p>
          </div>

          <form
            id="member-form"
            onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ResponsiveDialogBody className="pb-4">
              <TabsContent value="personal" className="mt-0 space-y-4">
                <FormSection title="Informações pessoais">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        placeholder="Digite o nome"
                        aria-invalid={Boolean(errors.firstName)}
                        {...form.register("firstName")}
                      />
                      <FieldError message={errors.firstName?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        placeholder="Digite o sobrenome"
                        aria-invalid={Boolean(errors.lastName)}
                        {...form.register("lastName")}
                      />
                      <FieldError message={errors.lastName?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="email@exemplo.com"
                        aria-invalid={Boolean(errors.email)}
                        {...form.register("email")}
                      />
                      <FieldError message={errors.email?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        {...form.register("phone")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de nascimento</Label>
                      <Input id="birthDate" type="date" autoComplete="bday" {...form.register("birthDate")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 99999-9999"
                        {...form.register("whatsapp")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={gender ?? "male"}
                        onValueChange={(value) => form.setValue("gender", value as Gender)}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Estado civil</Label>
                      <Select
                        value={maritalStatus ?? "single"}
                        onValueChange={(value) => form.setValue("maritalStatus", value as MaritalStatus)}
                      >
                        <SelectTrigger id="maritalStatus">
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

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="profession">Profissão</Label>
                      <Input
                        id="profession"
                        autoComplete="organization-title"
                        placeholder="Digite a profissão"
                        aria-invalid={Boolean(errors.profession)}
                        {...form.register("profession")}
                      />
                      <FieldError message={errors.profession?.message} />
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Contato de emergência">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Nome do contato</Label>
                      <Input
                        id="emergencyContact"
                        autoComplete="off"
                        placeholder="Nome do contato de emergência"
                        aria-invalid={Boolean(errors.emergencyContact)}
                        {...form.register("emergencyContact")}
                      />
                      <FieldError message={errors.emergencyContact?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telefone de emergência</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        placeholder="(11) 99999-9999"
                        aria-invalid={Boolean(errors.emergencyPhone)}
                        {...form.register("emergencyPhone")}
                      />
                      <FieldError message={errors.emergencyPhone?.message} />
                    </div>
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-4">
                <FormSection title="Endereço">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço completo</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Rua, número, bairro..."
                      {...form.register("address")}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        autoComplete="address-level2"
                        placeholder="São Paulo"
                        aria-invalid={Boolean(errors.city)}
                        {...form.register("city")}
                      />
                      <FieldError message={errors.city?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        maxLength={2}
                        autoComplete="address-level1"
                        autoCapitalize="characters"
                        placeholder="SP"
                        aria-invalid={Boolean(errors.state)}
                        {...form.register("state")}
                      />
                      <FieldError message={errors.state?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        aria-invalid={Boolean(errors.zipCode)}
                        {...form.register("zipCode")}
                      />
                      <FieldError message={errors.zipCode?.message} />
                    </div>
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="church" className="mt-0 space-y-4">
                <FormSection title="Informações da igreja">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberSince">Membro desde</Label>
                      <Input id="memberSince" type="date" {...form.register("memberSince")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baptismDate">Data do batismo</Label>
                      <Input id="baptismDate" type="date" {...form.register("baptismDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status ?? "active"}
                        onValueChange={(value) => form.setValue("status", value as MemberStatus)}
                      >
                        <SelectTrigger id="status">
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
                    <label htmlFor="baptized" className="flex min-h-10 cursor-pointer items-center gap-3 self-end text-sm font-medium">
                      <input
                        type="checkbox"
                        id="baptized"
                        className="size-5 accent-primary"
                        {...form.register("baptized")}
                      />
                      Batizado
                    </label>
                  </div>
                </FormSection>

                <FormSection title="Observações">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações adicionais</Label>
                    <Textarea id="notes" rows={4} placeholder="Observações sobre o membro" {...form.register("notes")} />
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="ministries" className="mt-0 space-y-4">
                <FormSection
                  title="Ministérios"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ ministryId: 0, functionId: undefined })}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-1 size-4" />
                      Adicionar ministério
                    </Button>
                  }
                >
                  {fields.map((field, index) => {
                    const selectedMinistryId = watchedMinistries?.[index]?.ministryId ?? 0;
                    const selectedFunctionId = watchedMinistries?.[index]?.functionId;
                    const ministryFunctions = getFunctionsForMinistry(selectedMinistryId);

                    return (
                      <div key={field.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-end">
                        <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="min-w-0 space-y-2">
                            <Label htmlFor={`ministry-${field.id}`}>Ministério</Label>
                            <Select
                              value={String(selectedMinistryId)}
                              onValueChange={(value) => {
                                form.setValue(`ministries.${index}.ministryId`, Number(value));
                                form.setValue(`ministries.${index}.functionId`, undefined);
                              }}
                            >
                              <SelectTrigger id={`ministry-${field.id}`}>
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

                          <div className="min-w-0 space-y-2">
                            <Label htmlFor={`function-${field.id}`}>Função</Label>
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
                              <SelectTrigger id={`function-${field.id}`}>
                                <SelectValue
                                  placeholder={
                                    ministryFunctions.length === 0 ? "Sem funções disponíveis" : "Selecione a função"
                                  }
                                />
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
                          onClick={() => remove(index)}
                          className="w-full text-destructive hover:text-destructive sm:w-auto"
                          aria-label="Remover ministério"
                        >
                          <Trash2 className="size-4" />
                          <span className="sm:hidden">Remover</span>
                        </Button>
                      </div>
                    );
                  })}

                  {fields.length === 0 && (
                    <div className="py-6 text-center text-muted-foreground">
                      <p className="text-sm">Nenhum ministério adicionado</p>
                      <p className="text-xs">Toque em &ldquo;Adicionar ministério&rdquo; para incluir</p>
                    </div>
                  )}
                </FormSection>
              </TabsContent>

              <TabsContent value="access" className="mt-0 space-y-4">
                <FormSection
                  title={
                    <>
                      <Key className="size-5" />
                      Acesso ao sistema
                    </>
                  }
                >
                  {mode === "create" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Label htmlFor="createUser" className="font-medium">
                            Criar usuário para acesso
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            O membro poderá acessar o sistema com o email cadastrado
                          </p>
                        </div>
                        <Switch id="createUser" checked={createUser} onCheckedChange={setCreateUser} />
                      </div>

                      {createUser && (
                        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                          <div className="space-y-2">
                            <Label htmlFor="accessEmail">Email para acesso</Label>
                            <Input id="accessEmail" value={email ?? ""} readOnly disabled className="bg-background" />
                            <p className="text-xs text-muted-foreground">
                              Será usado o email cadastrado nas informações pessoais
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="initialPassword">Senha inicial</Label>
                            <PasswordInput
                              id="initialPassword"
                              value={DEFAULT_PASSWORD}
                              readOnly
                              autoComplete="new-password"
                              className="bg-background"
                            />
                            <p className="text-xs text-muted-foreground">
                              O usuário receberá esta senha inicial e poderá alterá-la depois
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : existingUser ? (
                    <div className="space-y-4">
                      <div className={cn("rounded-lg border p-4", USER_ACCESS_STATUS[existingUser.status].boxClassName)}>
                        <div className="mb-2 flex items-center gap-2">
                          <User className="size-4" />
                          <span className="font-medium">{USER_ACCESS_STATUS[existingUser.status].title}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 text-sm text-foreground sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium">Email de acesso</p>
                            <p className="break-all font-medium">{existingUser.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Status</p>
                            <div className="mt-1">
                              <Badge variant={USER_ACCESS_STATUS[existingUser.status].variant}>
                                {USER_ACCESS_STATUS[existingUser.status].label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isSessionAdmin && (
                        <div className="flex min-h-10 items-center justify-between gap-4">
                          <div className="min-w-0">
                            <Label htmlFor="userIsAdmin" className="font-medium">
                              Administrador (acesso a Finanças)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Para o pastor e a tesouraria
                            </p>
                          </div>
                          <Switch
                            id="userIsAdmin"
                            checked={existingUser.isAdmin}
                            onCheckedChange={(checked) => void handleChangeUserAdmin(existingUser.id, checked)}
                            disabled={updateUserAdminMutation.isPending}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetPassword}
                          disabled={updateUserMutation.isPending}
                          className="flex-1"
                        >
                          <Key className="mr-2 size-4" />
                          {updateUserMutation.isPending ? "Redefinindo..." : "Redefinir senha"}
                        </Button>

                        {existingUser.status === "pending" ? (
                          <Button
                            type="button"
                            onClick={() => handleApproveUser(existingUser.id)}
                            disabled={updateUserMutation.isPending}
                            className="flex-1"
                          >
                            <Check className="mr-2 size-4" />
                            Aprovar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              void handleChangeUserStatus(
                                existingUser.id,
                                existingUser.status === "active" ? "inactive" : "active"
                              )
                            }
                            disabled={updateUserMutation.isPending}
                            className={cn(
                              "flex-1",
                              existingUser.status === "active" && "text-destructive hover:text-destructive"
                            )}
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
                          <User className="size-4" />
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
                        <UserPlus className="mr-2 size-4" />
                        {createUserMutation.isPending ? "Criando..." : "Criar acesso para este membro"}
                      </Button>

                      {!email && (
                        <p className="text-center text-xs text-destructive">
                          É necessário ter um email cadastrado para criar o acesso
                        </p>
                      )}
                    </div>
                  )}
                </FormSection>
              </TabsContent>
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter className="sm:flex-row-reverse sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1 sm:flex-none">
                  {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  {mode === "create" ? "Criar membro" : "Salvar"}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => previousTab && setActiveTab(previousTab.value)}
                  disabled={!previousTab}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => nextTab && setActiveTab(nextTab.value)}
                  disabled={!nextTab}
                  className="flex-1 sm:flex-none"
                >
                  Próximo
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </ResponsiveDialogFooter>
          </form>
        </Tabs>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

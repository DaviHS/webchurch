"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronRight, Key, Loader2, Plus, Save, Trash2, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
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
import { PhoneInput } from "@/components/phone-input";
import { InviteLinkDialog } from "./invite-link-dialog";
import { useConfirm } from "@/components/confirm-dialog";
import { api } from "@/trpc/react";
import { formatPhone } from "@/lib/phone";
import { fullName } from "@/lib/formatters";
import { formatCep, isCompleteCep, lookupCep } from "@/lib/cep";
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
  emergencyContact: "church",
  emergencyPhone: "church",
  baptized: "church",
  ministries: "ministries",
};

const NO_FUNCTION = "none";

const TAB_FIELDS: Record<TabValue, (keyof MemberFormInput)[]> = {
  personal: ["firstName", "lastName", "email", "phone", "whatsapp", "birthDate", "gender", "maritalStatus", "profession"],
  address: ["zipCode", "city", "state", "address"],
  church: ["status", "memberSince", "baptized", "baptismDate", "emergencyContact", "emergencyPhone", "notes"],
  ministries: ["ministries"],
  access: [],
};

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
      gender: undefined,
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
    phone: formatPhone(member.phone ?? ""),
    whatsapp: formatPhone(member.whatsapp ?? ""),
    birthDate: member.birthDate ?? "",
    gender: member.gender ?? undefined,
    maritalStatus: member.maritalStatus ?? "single",
    address: member.address ?? "",
    city: member.city ?? "",
    state: member.state ?? "",
    zipCode: member.zipCode ?? "",
    profession: member.profession ?? "",
    emergencyContact: member.emergencyContact ?? "",
    emergencyPhone: formatPhone(member.emergencyPhone ?? ""),
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
    <section className="space-y-3 rounded-md border p-4 sm:p-5">
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

  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "notfound" | "error">("idle");
  const lastLookedUp = useRef<string | null>(null);
  const cepRequest = useRef<AbortController | null>(null);

  const zipCodeField = form.register("zipCode");

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    form.setValue("zipCode", formatted, { shouldDirty: true });
    cepRequest.current?.abort();
    if (!isCompleteCep(formatted)) {
      setCepStatus("idle");
      return;
    }
    const digits = formatted.replace(/\D/g, "");
    if (lastLookedUp.current === digits) return;
    lastLookedUp.current = digits;
    const controller = new AbortController();
    cepRequest.current = controller;
    setCepStatus("loading");
    lookupCep(digits, controller.signal)
      .then((result) => {
        if (!result) {
          setCepStatus("notfound");
          return;
        }
        setCepStatus("idle");
        if (result.city) form.setValue("city", result.city, { shouldDirty: true });
        if (result.state) form.setValue("state", result.state, { shouldDirty: true });
        if (!form.getValues("address")?.trim()) {
          const street = [result.street, result.district].filter(Boolean).join(", ");
          if (street) form.setValue("address", `${street}, `, { shouldDirty: true });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        lastLookedUp.current = null;
        setCepStatus("error");
      });
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ministries",
  });

  const [email, gender, maritalStatus, status, watchedMinistries, baptized] = useWatch({
    control: form.control,
    name: ["email", "gender", "maritalStatus", "status", "ministries", "baptized"],
  });

  const { errors, isDirty } = form.formState;

  const [invite, setInvite] = useState<{ url: string; closeFormAfter: boolean } | null>(null);
  const inviteMutation = api.user.inviteLink.useMutation({
    onError: (error) => toastError(error.message),
  });
  const openInvite = (userId: number, closeFormAfter: boolean) => {
    inviteMutation.mutate(
      { userId, origin: window.location.origin },
      {
        onSuccess: (result) => setInvite({ url: result.url, closeFormAfter }),
        onSettled: () => void utils.user.getByMemberId.invalidate(),
      },
    );
  };

  const createUserMutation = api.user.create.useMutation(
    mutationFeedback({
      success: "Acesso criado. Agora envie o link para a pessoa criar a senha.",
      error: "Erro ao criar usuário",
      onSuccess: (user) => {
        void utils.user.getByMemberId.invalidate();
        if (user) openInvite(user.id, true);
        else onOpenChange(false);
      },
    })
  );

  const createMemberMutation = api.member.create.useMutation(
    mutationFeedback({
      success: "Membro criado com sucesso",
      error: "Erro ao criar membro",
      onSuccess: (newMember) => {
        if (createUser && newMember?.email) {
          createUserMutation.mutate({ memberId: newMember.id, email: newMember.email });
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
        description: "O usuário terá acesso total ao sistema, inclusive às finanças e ao gerenciamento de acessos.",
        confirmLabel: "Dar acesso",
      });
      if (!confirmed) return;
    }

    updateUserAdminMutation.mutate({ id: userId, isAdmin });
  };

  const handleSubmit = async (data: MemberFormData) => {
    const submitData = {
      ...data,
      ministries: data.ministries.filter((ministry) => ministry.ministryId > 0),
    };

    if (memberId === undefined) {
      if (!data.gender) {
        form.setError("gender", { message: "Selecione o gênero" });
        setActiveTab("personal");
        toastError("Selecione o gênero do membro");
        return;
      }
      if (createUser && !data.email?.trim()) {
        form.setError("email", { message: "Informe o e-mail para criar o acesso" });
        setActiveTab("personal");
        toastError("Para criar o acesso, informe o e-mail do membro");
        return;
      }
      const duplicates = await utils.member.findDuplicates
        .fetch({ firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone })
        .catch(() => []);
      if (duplicates.length > 0) {
        const confirmed = await confirm({
          title: "Já existe um cadastro parecido",
          description: duplicates.map((item) => `${item.name} (${item.reason})`).join("; ") + ". Cadastrar mesmo assim?",
          confirmLabel: "Cadastrar mesmo assim",
        });
        if (!confirmed) return;
      }
      createMemberMutation.mutate(submitData);
    } else {
      updateMemberMutation.mutate({ id: memberId, data: submitData });
    }
  };

  const handleInvalid = (formErrors: FieldErrors<MemberFormInput>) => {
    const firstField = Object.keys(formErrors)[0] as keyof MemberFormInput | undefined;
    if (!firstField) return;
    setActiveTab(FIELD_TABS[firstField] ?? "personal");
    toastError("Revise os campos destacados antes de salvar");
  };

  const handleCreateUserAccess = () => {
    if (memberId === undefined) return;
    if (!email) {
      toastError("O membro precisa ter um email para criar acesso");
      return;
    }

    createUserMutation.mutate({ memberId, email });
  };

  const handleResetPassword = () => {
    if (!existingUser) return;
    openInvite(existingUser.id, false);
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

  const requestClose = async () => {
    if (isDirty && !isSaving) {
      const discard = await confirm({
        title: "Descartar as alterações?",
        description: "O que você preencheu neste formulário será perdido.",
        confirmLabel: "Descartar",
        destructive: true,
      });
      if (!discard) return;
    }
    onOpenChange(false);
  };

  const activeIndex = TABS.findIndex((tab) => tab.value === activeTab);
  const nextTab = TABS[activeIndex + 1];

  const goNextTab = async () => {
    if (!nextTab) return;
    if (activeTab === "personal" && !form.getValues("gender")) {
      form.setError("gender", { message: "Selecione o gênero" });
      return;
    }
    const valid = await form.trigger(TAB_FIELDS[activeTab]);
    if (valid) setActiveTab(nextTab.value);
  };

  const getFunctionsForMinistry = (ministryId: number) => functionsByMinistry.get(ministryId) ?? [];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else void requestClose();
      }}
    >
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
                  {TAB_FIELDS[tab.value].some((field) => field in errors) && (
                    <span className="ml-1.5 size-2 rounded-full bg-destructive" role="img" aria-label="Há campos com erro nesta aba" />
                  )}
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
                      <PhoneInput id="phone" autoComplete="tel" placeholder="(11) 99999-9999" {...form.register("phone")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de nascimento</Label>
                      <Input id="birthDate" type="date" autoComplete="bday" {...form.register("birthDate")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <PhoneInput id="whatsapp" autoComplete="tel" placeholder="(11) 99999-9999" {...form.register("whatsapp")} />
                      <button
                        type="button"
                        onClick={() => form.setValue("whatsapp", form.getValues("phone") ?? "", { shouldDirty: true })}
                        className="min-h-8 text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        É o mesmo número do telefone
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={gender ?? ""}
                        onValueChange={(value) => form.setValue("gender", value as Gender, { shouldDirty: true, shouldValidate: true })}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.gender?.message} />
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
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-4">
                <FormSection title="Endereço">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <div className="relative">
                        <Input
                          id="zipCode"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="00000-000"
                          maxLength={9}
                          aria-invalid={Boolean(errors.zipCode) || cepStatus === "notfound"}
                          {...zipCodeField}
                          onChange={(event) => {
                            void zipCodeField.onChange(event);
                            handleCepChange(event.target.value);
                          }}
                        />
                        {cepStatus === "loading" && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                      </div>
                      <FieldError message={errors.zipCode?.message} />
                      {cepStatus === "notfound" && <p className="text-xs text-warning">CEP não encontrado. Confira os números ou preencha à mão.</p>}
                      {cepStatus === "error" && <p className="text-xs text-warning">Não foi possível consultar o CEP agora. Preencha à mão.</p>}
                    </div>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço completo</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Rua, número, bairro..."
                      {...form.register("address")}
                    />
                    <p className="text-xs text-muted-foreground">Digite o CEP e a rua e o bairro entram sozinhos. Falta só o número.</p>
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="church" className="mt-0 space-y-4">
                <FormSection title="Informações da igreja">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status ?? "active"}
                        onValueChange={(value) => {
                          form.setValue("status", value as MemberStatus, { shouldDirty: true });
                          const since = form.getValues("memberSince");
                          if (value !== "active" && since === todayIsoDate()) form.setValue("memberSince", "", { shouldDirty: true });
                          if (value === "active" && !since && mode === "create") form.setValue("memberSince", todayIsoDate(), { shouldDirty: true });
                        }}
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
                    <div className="space-y-2">
                      <Label htmlFor="memberSince">Membro desde</Label>
                      <Input id="memberSince" type="date" {...form.register("memberSince")} />
                    </div>
                    <label htmlFor="baptized" className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium sm:col-span-2">
                      <Switch
                        id="baptized"
                        checked={baptized ?? false}
                        onCheckedChange={(checked) => form.setValue("baptized", checked, { shouldDirty: true })}
                      />
                      Batizado(a)
                    </label>
                    {baptized && (
                      <div className="space-y-2">
                        <Label htmlFor="baptismDate">Data do batismo</Label>
                        <Input id="baptismDate" type="date" {...form.register("baptismDate")} />
                      </div>
                    )}
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
                      <PhoneInput
                        id="emergencyPhone"
                        autoComplete="off"
                        placeholder="(11) 99999-9999"
                        aria-invalid={Boolean(errors.emergencyPhone)}
                        {...form.register("emergencyPhone")}
                      />
                      <FieldError message={errors.emergencyPhone?.message} />
                    </div>
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
                      <div key={field.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-end">
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
                        <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                          <div className="space-y-2">
                            <Label htmlFor="accessEmail">Email para acesso</Label>
                            <Input id="accessEmail" value={email ?? ""} readOnly disabled className="bg-background" />
                            <p className="text-xs text-muted-foreground">
                              Será usado o email cadastrado nas informações pessoais
                            </p>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Ao salvar, o sistema gera um link para a pessoa criar a própria senha. Você envia o link por WhatsApp ou copia. Não existe senha padrão.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : existingUser ? (
                    <div className="space-y-4">
                      <div className={cn("rounded-md border p-4", USER_ACCESS_STATUS[existingUser.status].boxClassName)}>
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
                              Administrador (acesso total)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Ignora as permissões dos ministérios e vê tudo, inclusive finanças e acessos
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
                          disabled={inviteMutation.isPending || existingUser.status !== "active"}
                          title={existingUser.status !== "active" ? "Ative ou aprove o acesso primeiro" : undefined}
                          className="flex-1"
                        >
                          <Key className="mr-2 size-4" />
                          {inviteMutation.isPending ? "Gerando..." : "Gerar link de nova senha"}
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
                      <div className="rounded-md border border-warning/30 bg-warning/10 p-4">
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
              {mode === "create" && nextTab && (
                <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => void goNextTab()}>
                  Próximo: {nextTab.label}
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              )}
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void requestClose()}
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

            </ResponsiveDialogFooter>
          </form>
        </Tabs>
      </ResponsiveDialogContent>
      <InviteLinkDialog
        open={invite !== null}
        onOpenChange={(next) => {
          if (next) return;
          const closeForm = invite?.closeFormAfter ?? false;
          setInvite(null);
          if (closeForm) onOpenChange(false);
        }}
        url={invite?.url ?? null}
        name={form.getValues("firstName") || "a pessoa"}
        phone={form.getValues("whatsapp")?.trim() ? form.getValues("whatsapp") : form.getValues("phone")}
      />
    </ResponsiveDialog>
  );
}

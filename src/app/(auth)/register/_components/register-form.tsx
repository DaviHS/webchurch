"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterData, type RegisterInput } from "@/validators/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { toastError } from "@/lib/toast";
import { formatCep, isCompleteCep, lookupCep } from "@/lib/cep";
import { formatPhone } from "@/lib/phone";

type RegisterStep = "access" | "contact" | "church";

// Os campos obrigatórios ficam nos dois primeiros passos; "Igreja" é opcional.
const STEPS: { value: RegisterStep; label: string; fields: (keyof RegisterInput)[] }[] = [
  { value: "access", label: "Acesso", fields: ["firstName", "lastName", "email", "password", "confirmPassword"] },
  { value: "contact", label: "Contato", fields: ["phone", "phoneIsWhatsapp", "gender", "birthDate", "zipCode", "city", "state", "address"] },
  { value: "church", label: "Igreja", fields: ["baptized", "baptismDate", "memberSince"] },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
] as const;

type Gender = (typeof GENDER_OPTIONS)[number]["value"];

const isRegisterStep = (value: string): value is RegisterStep => STEPS.some((step) => step.value === value);

const isGender = (value: string): value is Gender => GENDER_OPTIONS.some((option) => option.value === value);

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function Required() {
  return (
    <span className="text-destructive" aria-hidden>
      {" "}
      *
    </span>
  );
}

export function RegisterForm() {
  const [activeStep, setActiveStep] = useState<RegisterStep>("access");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      phoneIsWhatsapp: true,
      birthDate: "",
      gender: undefined,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      baptized: false,
      baptismDate: "",
      memberSince: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [gender, baptized, phoneIsWhatsapp] = useWatch({
    control: form.control,
    name: ["gender", "baptized", "phoneIsWhatsapp"],
  });
  const { errors } = form.formState;

  // Ao completar o CEP (8 dígitos), busca o endereço e preenche cidade, estado e, se estiver vazio, a rua e o bairro.
  const zipCodeField = form.register("zipCode");
  const phoneField = form.register("phone");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "notfound" | "error">("idle");
  const lastLookedUp = useRef<string | null>(null);
  const cepRequest = useRef<AbortController | null>(null);

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

  const createRegisterMutation = api.register.create.useMutation({
    onSuccess: (data) => setSubmittedEmail(data.user.email),
    onError: (error) => toastError(error.message),
  });

  const stepIndex = STEPS.findIndex((step) => step.value === activeStep);

  const handleSubmit = (data: RegisterData) => {
    createRegisterMutation.mutate(data);
  };

  const handleInvalid = (invalid: FieldErrors<RegisterInput>) => {
    const stepWithError = STEPS.find(({ fields }) => fields.some((field) => field in invalid));
    if (stepWithError) setActiveStep(stepWithError.value);
    toastError("Corrija os campos indicados antes de continuar");
  };

  // Só avança se os campos do passo atual estão certos; assim o erro aparece onde a pessoa está.
  const goNext = async () => {
    const current = STEPS[stepIndex];
    const next = STEPS[stepIndex + 1];
    if (!current || !next) return;
    const valid = await form.trigger(current.fields);
    if (valid) setActiveStep(next.value);
  };

  if (submittedEmail) {
    return (
      <div className="space-y-4 py-2 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h2 className="text-xl font-semibold">Cadastro enviado!</h2>
        <p className="text-sm text-muted-foreground">
          A liderança da igreja vai analisar o seu pedido e liberar o acesso. Depois da aprovação, entre com o e-mail{" "}
          <span className="font-medium text-foreground">{submittedEmail}</span> e a senha que você criou.
        </p>
        <Button asChild className="w-full">
          <Link href="/sign-in">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Tabs value={activeStep} onValueChange={(value) => isRegisterStep(value) && setActiveStep(value)} className="w-full">
      <p className="mb-2 text-center text-xs text-muted-foreground" aria-live="polite">
        Passo {stepIndex + 1} de {STEPS.length} · <span className="text-destructive">*</span> obrigatório
      </p>
      <TabsList className="mb-6 flex h-11 w-full justify-start overflow-x-auto">
        {STEPS.map((step) => (
          <TabsTrigger key={step.value} value={step.value} className="h-9 min-w-fit flex-1">
            {step.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-4" noValidate>
        <TabsContent value="access" className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Nome
                  <Required />
                </Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  aria-invalid={Boolean(errors.firstName)}
                  {...form.register("firstName")}
                />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Sobrenome
                  <Required />
                </Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  aria-invalid={Boolean(errors.lastName)}
                  {...form.register("lastName")}
                />
                <FieldError message={errors.lastName?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                E-mail
                <Required />
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(errors.email)}
                {...form.register("email")}
                placeholder="seu@email.com"
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha
                <Required />
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                enterKeyHint="next"
                {...form.register("password")}
                placeholder="Mínimo 6 caracteres"
                aria-invalid={Boolean(errors.password)}
              />
              <FieldError message={errors.password?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar senha
                <Required />
              </Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                enterKeyHint="done"
                {...form.register("confirmPassword")}
                placeholder="Digite a senha novamente"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <FieldError message={errors.confirmPassword?.message} />
            </div>
          </div>

          <Button type="button" onClick={() => void goNext()} className="w-full">
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone
                <Required />
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                maxLength={15}
                aria-invalid={Boolean(errors.phone)}
                {...phoneField}
                onChange={(event) => {
                  event.target.value = formatPhone(event.target.value);
                  void phoneField.onChange(event);
                }}
                placeholder="(11) 99999-9999"
              />
              <FieldError message={errors.phone?.message} />
              <label htmlFor="phoneIsWhatsapp" className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <Switch id="phoneIsWhatsapp" checked={phoneIsWhatsapp} onCheckedChange={(checked) => form.setValue("phoneIsWhatsapp", checked)} />
                Este número tem WhatsApp
              </label>
              <p className="text-xs text-muted-foreground">A liderança usa o telefone para confirmar o seu cadastro.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gênero
                  <Required />
                </Label>
                <Select
                  value={gender ?? ""}
                  onValueChange={(value) => {
                    if (isGender(value)) form.setValue("gender", value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger id="gender" aria-invalid={Boolean(errors.gender)}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.gender?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Nascimento</Label>
                <Input id="birthDate" type="date" autoComplete="bday" {...form.register("birthDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="relative">
                <Input
                  id="zipCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  enterKeyHint="next"
                  {...zipCodeField}
                  onChange={(event) => {
                    void zipCodeField.onChange(event);
                    handleCepChange(event.target.value);
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {cepStatus === "loading" && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
              </div>
              {cepStatus === "notfound" && <p className="text-xs text-warning">CEP não encontrado. Confira os números ou preencha à mão.</p>}
              {cepStatus === "error" && <p className="text-xs text-warning">Não foi possível consultar o CEP agora. Preencha à mão.</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  enterKeyHint="next"
                  {...form.register("city")}
                  placeholder="São Paulo"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  autoComplete="address-level1"
                  autoCapitalize="characters"
                  enterKeyHint="next"
                  {...form.register("state")}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                autoComplete="street-address"
                enterKeyHint="done"
                {...form.register("address")}
                placeholder="Rua, número, bairro"
              />
              <p className="text-xs text-muted-foreground">Digite o CEP e a rua e o bairro entram sozinhos. Falta só o número.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveStep("access")} className="flex-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button type="button" onClick={() => void goNext()} className="flex-1">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button type="submit" variant="ghost" disabled={createRegisterMutation.isPending} className="w-full">
            {createRegisterMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Pular o passo da igreja e criar conta
          </Button>
        </TabsContent>

        <TabsContent value="church" className="space-y-4">
          <p className="text-sm text-muted-foreground">Este passo é opcional. A liderança pode completar depois.</p>
          <div className="space-y-3">
            <label htmlFor="baptized" className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium">
              <Switch id="baptized" checked={baptized} onCheckedChange={(checked) => form.setValue("baptized", checked)} />
              Sou batizado(a)
            </label>

            {baptized && (
              <div className="space-y-2">
                <Label htmlFor="baptismDate">Data do batismo</Label>
                <Input id="baptismDate" type="date" {...form.register("baptismDate")} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="memberSince">Membro desde</Label>
              <Input id="memberSince" type="date" {...form.register("memberSince")} />
              <p className="text-xs text-muted-foreground">Deixe em branco se não souber ou se for a sua primeira vez na igreja.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveStep("contact")} className="flex-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button type="submit" disabled={createRegisterMutation.isPending} className="flex-1">
              {createRegisterMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </div>
        </TabsContent>
      </form>
    </Tabs>
  );
}

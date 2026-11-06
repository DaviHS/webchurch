"use client";

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
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

type RegisterStep = "personal" | "address" | "church" | "password";

const STEPS: { value: RegisterStep; label: string; fields: (keyof RegisterInput)[] }[] = [
  { value: "personal", label: "Pessoal", fields: ["firstName", "lastName", "email", "phone", "birthDate", "gender"] },
  { value: "address", label: "Endereço", fields: ["address", "city", "state", "zipCode"] },
  { value: "church", label: "Igreja", fields: ["memberSince", "baptismDate", "baptized"] },
  { value: "password", label: "Senha", fields: ["password", "confirmPassword"] },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
] as const;

type Gender = (typeof GENDER_OPTIONS)[number]["value"];

const isRegisterStep = (value: string): value is RegisterStep => STEPS.some((step) => step.value === value);

const isGender = (value: string): value is Gender => GENDER_OPTIONS.some((option) => option.value === value);

const todayIso = () => new Date().toLocaleDateString("en-CA");

export function RegisterForm() {
  const [activeStep, setActiveStep] = useState<RegisterStep>("personal");
  const router = useRouter();

  const form = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      gender: "male",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      baptized: false,
      baptismDate: "",
      memberSince: todayIso(),
      password: "",
      confirmPassword: "",
    },
  });

  const [gender, baptized] = useWatch({
    control: form.control,
    name: ["gender", "baptized"],
  });

  const createRegisterMutation = api.register.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/sign-in");
    },
    onError: (error) => {
      toastError(`Erro ao criar conta: ${error.message}`);
    },
  });

  const stepIndex = STEPS.findIndex((step) => step.value === activeStep);

  const handleSubmit = (data: RegisterData) => {
    createRegisterMutation.mutate(data);
  };

  const handleInvalid = (errors: FieldErrors<RegisterInput>) => {
    const stepWithError = STEPS.find(({ fields }) => fields.some((field) => field in errors));
    if (stepWithError) setActiveStep(stepWithError.value);
    toastError("Corrija os campos indicados antes de continuar");
  };

  const handleStepChange = (value: string) => {
    if (isRegisterStep(value)) setActiveStep(value);
  };

  return (
    <Tabs value={activeStep} onValueChange={handleStepChange} className="w-full">
      <p className="mb-2 text-center text-xs text-muted-foreground" aria-live="polite">
        Passo {stepIndex + 1} de {STEPS.length}
      </p>
      <TabsList className="mb-6 flex h-11 w-full justify-start overflow-x-auto">
        {STEPS.map((step) => (
          <TabsTrigger key={step.value} value={step.value} className="h-9 min-w-fit flex-1">
            {step.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-4">
        <TabsContent value="personal" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                {...form.register("firstName")}
                placeholder="Digite seu nome"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                {...form.register("lastName")}
                placeholder="Digite seu sobrenome"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                {...form.register("email")}
                placeholder="seu@email.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  {...form.register("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Nascimento</Label>
                <Input id="birthDate" type="date" autoComplete="bday" {...form.register("birthDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={gender}
                onValueChange={(value) => {
                  if (isGender(value)) form.setValue("gender", value);
                }}
              >
                <SelectTrigger id="gender">
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
            </div>
          </div>

          <Button type="button" onClick={() => setActiveStep("address")} className="w-full">
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                autoComplete="street-address"
                enterKeyHint="next"
                {...form.register("address")}
                placeholder="Rua, número, bairro"
              />
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
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                inputMode="numeric"
                autoComplete="postal-code"
                enterKeyHint="next"
                {...form.register("zipCode")}
                placeholder="00000-000"
                maxLength={10}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveStep("personal")} className="flex-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button type="button" onClick={() => setActiveStep("church")} className="flex-1">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="church" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="memberSince">Membro desde</Label>
              <Input id="memberSince" type="date" {...form.register("memberSince")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baptismDate">Data do batismo</Label>
              <Input id="baptismDate" type="date" {...form.register("baptismDate")} />
            </div>

            <div className="flex min-h-10 items-center gap-3">
              <Switch
                id="baptized"
                checked={baptized}
                onCheckedChange={(checked) => form.setValue("baptized", checked)}
              />
              <Label htmlFor="baptized">Batizado</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveStep("address")} className="flex-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button type="button" onClick={() => setActiveStep("password")} className="flex-1">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                enterKeyHint="next"
                {...form.register("password")}
                placeholder="Mínimo 6 caracteres"
                aria-invalid={!!form.formState.errors.password}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha *</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                enterKeyHint="done"
                {...form.register("confirmPassword")}
                placeholder="Digite a senha novamente"
                aria-invalid={!!form.formState.errors.confirmPassword}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveStep("church")} className="flex-1">
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

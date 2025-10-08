"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterData } from "@/validators/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

export function RegisterForm() {
  const [activeTab, setActiveTab] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterData>({
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
      memberSince: new Date().toISOString().split('T')[0],
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = api.register.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/sign-in");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const tabs = ["personal", "address", "church", "password"] as const;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="personal" className="text-xs">Pessoal</TabsTrigger>
        <TabsTrigger value="address" className="text-xs">Endereço</TabsTrigger>
        <TabsTrigger value="church" className="text-xs">Igreja</TabsTrigger>
        <TabsTrigger value="password" className="text-xs">Senha</TabsTrigger>
      </TabsList>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TabsContent value="personal" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm">Nome *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Digite seu nome"
                className="text-sm"
              />
              {form.formState.errors.firstName && (
                <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm">Sobrenome *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Digite seu sobrenome"
                className="text-sm"
              />
              {form.formState.errors.lastName && (
                <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="seu@email.com"
                className="text-sm"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Telefone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(11) 99999-9999"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm">Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...form.register("birthDate")}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Gênero</Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setActiveTab("address")}
            className="w-full"
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">Endereço</Label>
              <Input
                id="address"
                {...form.register("address")}
                placeholder="Rua, número, bairro"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">Cidade</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="São Paulo"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm">Estado</Label>
                <Input
                  id="state"
                  {...form.register("state")}
                  placeholder="SP"
                  maxLength={2}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-sm">CEP</Label>
              <Input
                id="zipCode"
                {...form.register("zipCode")}
                placeholder="00000-000"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("personal")}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("church")}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="church" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="memberSince" className="text-sm">Membro desde</Label>
              <Input
                id="memberSince"
                type="date"
                {...form.register("memberSince")}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baptismDate" className="text-sm">Data do Batismo</Label>
              <Input
                id="baptismDate"
                type="date"
                {...form.register("baptismDate")}
                className="text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="baptized"
                checked={form.watch("baptized")}
                onCheckedChange={(checked) => form.setValue("baptized", checked)}
              />
              <Label htmlFor="baptized" className="text-sm">Batizado</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("address")}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("password")}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="Mínimo 6 caracteres"
                  className="text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...form.register("confirmPassword")}
                  placeholder="Digite a senha novamente"
                  className="text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("church")}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex-1"
            >
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
          </div>
        </TabsContent>
      </form>
    </Tabs>
  );
}
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberFormData } from "@/validators/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, X, Plus, Loader2, Trash2, UserPlus, Eye, EyeOff, ChevronLeft, ChevronRight, Key, User } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";

interface MemberFormDialogProps {
  member?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

type TabValue = "personal" | "address" | "church" | "ministries" | "access";

const tabs: TabValue[] = ["personal", "address", "church", "ministries", "access"];

export function MemberFormDialog({ member, open, onOpenChange, mode }: MemberFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  
  const { data: ministries = [] } = api.ministry.getAll.useQuery(undefined, {
    enabled: open,
  });

  const { data: allMinistryFunctions = [] } = api.ministry.getAllMinistryFunctions.useQuery(undefined, {
    enabled: open,
  });

  const { data: existingUser } = api.user.getByMemberId.useQuery(
    { memberId: member?.id },
    { 
      enabled: open && mode === "edit" && !!member?.id,
    }
  );

  const functionsByMinistry = useMemo(() => {
    const map = new Map<number, any[]>();
    
    allMinistryFunctions.forEach((mf) => {
      if (!map.has(mf.ministryId)) {
        map.set(mf.ministryId, []);
      }
      map.get(mf.ministryId)!.push({
        functionId: mf.functionId,
        functionName: mf.functionName,
      });
    });
    
    return map;
  }, [allMinistryFunctions]);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
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
      memberSince: new Date().toISOString().split('T')[0],
      status: "active",
      notes: "",
      baptized: false,
      ministries: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ministries",
  });

  const createMember = api.member.create.useMutation({
    onSuccess: (newMember) => {
      toast.success("Membro criado com sucesso!");
      
      if (createUser && newMember?.email) {
        createUserMutation.mutate({
          memberId: newMember.id,
          email: newMember.email,
          password: "123456",
        });
      } else {
        onOpenChange(false);
        form.reset();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMember = api.member.update.useMutation({
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (open) {
      if (member && mode === "edit") {
        console.log('Member data:', member);
        console.log('Member ministries:', member.ministries);

        const ministriesData = member.ministries?.map((min: any) => ({
          ministryId: min.ministryId,
          functionId: min.functionId || undefined,
        })) || [];

        const formData = {
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          email: member.email || "",
          phone: member.phone || "",
          whatsapp: member.whatsapp || "",
          birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : "",
          gender: member.gender || "male",
          maritalStatus: member.maritalStatus || "single",
          address: member.address || "",
          city: member.city || "",
          state: member.state || "",
          zipCode: member.zipCode || "",
          profession: member.profession || "",
          emergencyContact: member.emergencyContact || "",
          emergencyPhone: member.emergencyPhone || "",
          baptismDate: member.baptismDate ? new Date(member.baptismDate).toISOString().split('T')[0] : "",
          memberSince: member.memberSince ? new Date(member.memberSince).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: member.status || "active",
          notes: member.notes || "",
          baptized: member.baptized || false,
          ministries: ministriesData,
        };

        console.log('Form data to reset:', formData); // Para debug
        form.reset(formData);
        
        setCreateUser(!!existingUser);
      } else {
        form.reset({
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
          memberSince: new Date().toISOString().split('T')[0],
          status: "active",
          notes: "",
          baptized: false,
          ministries: [],
        });
        setCreateUser(false);
      }
      setActiveTab("personal");
    }
  }, [open, member, mode, form, existingUser]);

  const onSubmit = async (data: MemberFormData) => {
    try {
      const validMinistries = data.ministries.filter(ministry => ministry.ministryId > 0);
      
      const submitData = {
        ...data,
        ministries: validMinistries,
      };

      console.log('Submitting data:', submitData);

      if (mode === "create") {
        await createMember.mutateAsync(submitData);
      } else {
        await updateMember.mutateAsync({
          id: member.id,
          data: submitData,
        });
      }
    } catch (error) {
    }
  };

  const handleCreateUserAccess = async () => {
    if (!form.watch("email")) {
      toast.error("O membro precisa ter um email para criar acesso");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        memberId: member.id,
        email: form.watch("email")!,
        password: "123456",
      });
    } catch (error) {
      // Erro já é tratado na mutation
    }
  };

  const handleResetPassword = async () => {
    if (!existingUser?.id) return;

    try {
      await updateUserMutation.mutateAsync({
        id: existingUser.id,
        password: "123456",
      });
      toast.success("Senha resetada para 123456");
    } catch (error) {
    }
  };

  const isLoading = createMember.isPending || updateMember.isPending || createUserMutation.isPending || updateUserMutation.isPending;

  const getFunctionsForMinistry = (ministryId: number) => {
    return functionsByMinistry.get(ministryId) || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Novo Membro" : `Editar ${member?.firstName} ${member?.lastName}`}
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
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
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
                      <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>
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
                      <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>
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
                      <Label htmlFor="birthDate" className="text-sm">Data de Nascimento</Label>
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
                        value={form.watch("gender") || "male"}
                        onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
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
                      <Label className="text-sm">Estado Civil</Label>
                      <Select
                        value={form.watch("maritalStatus") || "single"}
                        onValueChange={(value) =>
                          form.setValue("maritalStatus", value as "single" | "married" | "divorced" | "widowed")
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
                  <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-sm">Nome do Contato</Label>
                    <Input 
                      id="emergencyContact" 
                      {...form.register("emergencyContact")} 
                      className="text-sm sm:text-base"
                      placeholder="Nome do contato de emergência"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-sm">Telefone de Emergência</Label>
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
                    <Label htmlFor="address" className="text-sm">Endereço Completo</Label>
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
                  <CardTitle className="text-lg">Informações da Igreja</CardTitle>
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
                    <Label htmlFor="baptismDate" className="text-sm">Data do Batismo</Label>
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
                      value={form.watch("status") || "active"}
                      onValueChange={(value) =>
                        form.setValue("status", value as "active" | "inactive" | "visiting" | "transferred")
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
                      className="mr-2"
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
                    <Label htmlFor="notes" className="text-sm">Observações Adicionais</Label>
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
                      Adicionar Ministério
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.map((field, index) => {
                    const selectedMinistryId = form.watch(`ministries.${index}.ministryId`);
                    const selectedFunctionId = form.watch(`ministries.${index}.functionId`);
                    const ministryFunctions = getFunctionsForMinistry(selectedMinistryId);

                    console.log(`Field ${index}:`, { 
                      ministryId: selectedMinistryId, 
                      functionId: selectedFunctionId,
                      availableFunctions: ministryFunctions 
                    }); // Para debug

                    return (
                      <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          <div className="space-y-2">
                            <Label className="text-sm">Ministério</Label>
                            <Select
                              value={selectedMinistryId?.toString() || ""}
                              onValueChange={(value) => {
                                const ministryId = Number(value);
                                form.setValue(`ministries.${index}.ministryId`, ministryId);
                                // Resetar função quando mudar o ministério
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
                              value={selectedFunctionId?.toString() || ""}
                              onValueChange={(value) =>
                                form.setValue(`ministries.${index}.functionId`, value ? Number(value) : undefined)
                              }
                              disabled={!selectedMinistryId || selectedMinistryId === 0}
                            >
                              <SelectTrigger className="text-sm sm:text-base">
                                <SelectValue placeholder={
                                  ministryFunctions.length === 0 ? "Sem funções disponíveis" : "Selecione a função"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Sem função específica</SelectItem>
                                {ministryFunctions.map((mf: any) => (
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
                          className="text-red-600 hover:text-red-700 mt-2 sm:mt-0 w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhum ministério adicionado</p>
                      <p className="text-xs">Clique em "Adicionar Ministério" para incluir</p>
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
                    Acesso do Sistema
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
                              value={form.watch("email") || ""} 
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
                                value="123456" 
                                disabled 
                                className="text-sm sm:text-base bg-background"
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
                          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Usuário já possui acesso</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-xs">Email de acesso</Label>
                                <p className="font-medium">{existingUser.email}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Status</Label>
                                <p className="font-medium">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    existingUser.isActive 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {existingUser.isActive ? 'Ativo' : 'Inativo'}
                                  </span>
                                </p>
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
                              {updateUserMutation.isPending ? "Resetando..." : "Resetar Senha"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateUserMutation.mutate({
                                id: existingUser.id,
                                isActive: !existingUser.isActive
                              })}
                              disabled={updateUserMutation.isPending}
                              className="flex-1"
                            >
                              {existingUser.isActive ? "Desativar Acesso" : "Ativar Acesso"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Sem acesso ao sistema</span>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Este membro ainda não possui uma conta de acesso ao sistema.
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={handleCreateUserAccess}
                            disabled={createUserMutation.isPending || !form.watch("email")}
                            className="w-full"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {createUserMutation.isPending ? "Criando..." : "Criar Acesso para este Membro"}
                          </Button>

                          {!form.watch("email") && (
                            <p className="text-xs text-red-500 text-center">
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
                    {mode === "create" ? "Criar Membro" : "Salvar"}
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
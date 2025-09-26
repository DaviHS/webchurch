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
import { Save, X, Plus, Loader2, Trash2, UserPlus, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { sanitizeMemberForForm } from "@/lib/sanitize";

interface MemberFormDialogProps {
  member?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

type TabValue = "personal" | "address" | "church" | "ministries";

const tabs: TabValue[] = ["personal", "address", "church", "ministries"];

export function MemberFormDialog({ member, open, onOpenChange, mode }: MemberFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  
  const { data: ministries = [] } = api.ministry.getAll.useQuery();


  const createMember = api.member.create.useMutation({
    onSuccess: (newMember) => {
      toast.success("Membro criado com sucesso!");
      
      // Criar usuário se solicitado
      if (createUser && newMember?.email) {
        createUserMutation.mutate({
          memberId: newMember.id,
          email: newMember.email,
          password: "123456",
        });
      } else {
        onOpenChange(false);
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
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: "active",
      gender: "male",
      maritalStatus: "single",
      baptized: false,
      ministries: [],
    },
  });

  const { data: ministryFunctions = [] } = api.ministry.getMinistryFunctions.useQuery(
    { ministryId: form.watch(`ministries.${index}.ministryId`) },
    { enabled: !!form.watch(`ministries.${index}.ministryId`) }
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ministries",
  });

  useEffect(() => {
    if (member && open) {
      form.reset(sanitizeMemberForForm(member));
      setCreateUser(!!member.userId);
    } else if (open) {
      form.reset({
        status: "active",
        gender: "male",
        maritalStatus: "single",
        baptized: false,
        ministries: [],
      });
      setCreateUser(false);
      setActiveTab("personal");
    }
  }, [member, open, form]);

  const onSubmit = async (data: MemberFormData) => {
    if (mode === "create") {
      createMember.mutate(data);
    } else {
      updateMember.mutate({
        id: member.id,
        data,
      });
    }
  };

  const isLoading = createMember.isPending || updateMember.isPending || createUserMutation.isPending;

  // Corrigir valores para o Select
  const genderValue = form.watch("gender") || "";
  const maritalStatusValue = form.watch("maritalStatus") || "single";
  const statusValue = form.watch("status") || "active";

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

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val) setActiveTab(val as TabValue);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto py-2">
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
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Aba: Informações Pessoais */}
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Telefone</Label>
                      <Input 
                        id="phone" 
                        {...form.register("phone")} 
                        className="text-sm sm:text-base"
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
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Gênero</Label>
                      <Select
                        value={genderValue}
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
                        value={maritalStatusValue}
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
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contato de Emergência */}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-sm">Telefone de Emergência</Label>
                    <Input 
                      id="emergencyPhone" 
                      {...form.register("emergencyPhone")} 
                      className="text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Criação de Usuário (apenas para novo membro) */}
              {mode === "create" && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg">Criar Usuário</CardTitle>
                      <Button
                        type="button"
                        variant={createUser ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCreateUser(!createUser)}
                        className="w-full sm:w-auto"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {createUser ? "Criar Usuário" : "Não Criar"}
                      </Button>
                    </div>
                  </CardHeader>
                  {createUser && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Email para acesso</Label>
                          <Input 
                            value={form.watch("email") || ""} 
                            disabled 
                            placeholder="Usará o email cadastrado acima"
                            className="text-sm sm:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Senha inicial</Label>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              value="123456" 
                              disabled 
                              className="text-sm sm:text-base"
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
                    </CardContent>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* Aba: Endereço */}
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
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm">Cidade</Label>
                      <Input 
                        id="city" 
                        {...form.register("city")} 
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm">Estado</Label>
                      <Input 
                        id="state" 
                        {...form.register("state")} 
                        maxLength={2} 
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm">CEP</Label>
                      <Input 
                        id="zipCode" 
                        {...form.register("zipCode")} 
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Igreja */}
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
                      value={statusValue}
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
                </CardContent>
              </Card>

              {/* Observações */}
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

            {/* Aba: Ministérios */}
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
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 gap-3 w-full">
                        <div className="space-y-2">
                          <Label className="text-sm">Ministério *</Label>
                          <Select
                            value={form.watch(`ministries.${index}.ministryId`)?.toString() || ""}
                            onValueChange={(value) => form.setValue(`ministries.${index}.ministryId`, Number(value))}
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue placeholder="Selecione o ministério" />
                            </SelectTrigger>
                            <SelectContent>
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
                            value={form.watch(`ministries.${index}.functionId`)?.toString() || ""}
                            onValueChange={(value) =>
                              form.setValue(`ministries.${index}.functionId`, value ? Number(value) : undefined)
                            }
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue placeholder="Sem função" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sem função</SelectItem>
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
                        className="text-red-600 hover:text-red-700 mt-2 sm:mt-0 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhum ministério adicionado</p>
                      <p className="text-xs">Clique em "Adicionar Ministério" para incluir</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Navegação entre abas e botões de ação */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs: TabValue[] = ["personal", "address", "church", "ministries"];
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
                    const tabs: TabValue[] = ["personal", "address", "church", "ministries"];
                    const currentIndex = tabs.indexOf(activeTab);
                    const nextTab = tabs[currentIndex + 1];
                    if (nextTab) setActiveTab(nextTab);
                  }}
                  disabled={activeTab === "ministries"}
                  className="flex-1 sm:flex-none"
                >
                  Próximo
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
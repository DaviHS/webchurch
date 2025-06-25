"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { memberSchema, type MemberFormData } from "@/validators/member"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function NewMemberPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createLogin, setCreateLogin] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [activeTab, setActiveTab] = useState("pessoais")

  const { data: ministries = [] } = api.ministry.getAll.useQuery()
  const { data: functions = [] } = api.functions.getAll.useQuery()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: "active",
      ministries: [],
    },
  })

  const memberEmail = watch("email")
  const selectedMinistries = watch("ministries") || []

  useEffect(() => {
    if (createLogin && (userEmail === "" || userEmail === memberEmail)) {
      setUserEmail(memberEmail || "")
    }
  }, [memberEmail, createLogin])

  const createMember = api.member.create.useMutation({
    onSuccess: () => {
      toast.success("Membro cadastrado com sucesso!")
      router.push("/app/admin/members")
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar membro")
    },
  })

  const createUser = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!")
    },
    onError: (error) => {
      toast.error("Erro ao criar usuário: " + error.message)
    },
  })

  const onSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true)
    try {
      const member = await createMember.mutateAsync(data)

      if (createLogin && member?.id) {
        await createUser.mutateAsync({
          memberId: member.id,
          email: userEmail,
          password: userPassword,
        })
      }

      toast.success("Cadastro completo!")
      router.push("/app/admin/members")
    } catch (error) {
      toast.error("Erro ao cadastrar membro ou usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMinistryChange = (ministryId: number, checked: boolean) => {
    const current = selectedMinistries
    if (checked) {
      setValue("ministries", [...current, { ministryId, functionId: 0}])
    } else {
      setValue("ministries", current.filter((m) => m.ministryId !== ministryId))
    }
  }

  const handleFunctionChange = (ministryId: number, functionId: number) => {
    setValue(
      "ministries",
      selectedMinistries.map((m) =>
        m.ministryId === ministryId ? { ...m, functionId } : m
      )
    )
  }

  const tabs = [
    { value: "pessoais", label: "Dados Pessoais" },
    { value: "endereco", label: "Endereço" },
    { value: "igreja", label: "Igreja" },
    { value: "ministerios", label: "Ministérios" },
    { value: "acesso", label: "Acesso" },
  ]

  const tabIndex = tabs.findIndex((tab) => tab.value === activeTab)
  const isLastTab = tabIndex === tabs.length - 1
  const isFirstTab = tabIndex === 0

  const goToNextTab = () => {
    const nextIndex = Math.min(tabIndex + 1, tabs.length - 1)
    setActiveTab(tabs[nextIndex]!.value)
  }

  const goToPrevTab = () => {
    const prevIndex = Math.max(tabIndex - 1, 0)
    setActiveTab(tabs[prevIndex]!.value)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Cadastro de Membro</h1>
        <p className="text-muted-foreground">Preencha os dados do novo membro da igreja</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma aba" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full grid-cols-5">
            {tabs.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="pessoais" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Dados básicos do membro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input id="firstName" {...register("firstName")} placeholder="Nome" />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input id="lastName" {...register("lastName")} placeholder="Sobrenome" />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input id="birthDate" type="date" {...register("birthDate")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select
                      onValueChange={(value) => setValue("gender", value as "male" | "female")}
                      defaultValue=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Estado Civil</Label>
                    <Select
                      onValueChange={(value) => setValue("maritalStatus", value as "single" | "married" | "divorced" | "widowed")}
                      defaultValue="single"
                      
                    >
                      <SelectTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profissão</Label>
                    <Input id="profession" {...register("profession")} placeholder="Profissão" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" {...register("whatsapp")} placeholder="(11) 99999-9999" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                    <Input
                      id="emergencyContact"
                      {...register("emergencyContact")}
                      placeholder="Nome do contato"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                    <Input
                      id="emergencyPhone"
                      {...register("emergencyPhone")}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informações de endereço do membro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="Rua, número, complemento"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" {...register("city")} placeholder="Cidade" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" {...register("state")} placeholder="SP" maxLength={2} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" {...register("zipCode")} placeholder="00000-000" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="igreja" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Igreja</CardTitle>
                <CardDescription>Dados relacionados à vida na igreja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baptized">Batizado</Label>
                  <Checkbox
                    id="baptized"
                    {...register("baptized")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baptismDate">Data do Batismo</Label>
                  <Input id="baptismDate" type="date" {...register("baptismDate")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="churchRole">Função na Igreja</Label>
                  <Input id="churchRole" {...register("churchRole")} placeholder="Ex: Diácono" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ministerios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ministérios</CardTitle>
                <CardDescription>Selecione os ministérios que o membro participa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ministries.map((ministry) => {
                  const isSelected = selectedMinistries.some((m) => m.ministryId === ministry.id)
                  const selectedFunctionId = selectedMinistries.find((m) => m.ministryId === ministry.id)?.functionId

                  return (
                    <div key={ministry.id} className="flex items-center gap-4 mb-2">
                      <Checkbox
                        id={`ministry-${ministry.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleMinistryChange(ministry.id, checked === true)
                        }
                      />
                      <Label htmlFor={`ministry-${ministry.id}`} className="flex-1">
                        {ministry.name}
                      </Label>

                      {isSelected && (
                        <Select
                          value={selectedFunctionId ? String(selectedFunctionId) : ""}
                          onValueChange={(value) =>
                            handleFunctionChange(ministry.id, Number(value))
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Função" />
                          </SelectTrigger>
                          <SelectContent>
                            {functions.map((fn) => (
                              <SelectItem key={fn.id} value={String(fn.id)}>
                                {fn.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acesso" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Acesso</CardTitle>
                <CardDescription>Configurações de login para o membro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="createLogin"
                    checked={createLogin}
                    onCheckedChange={(checked) => setCreateLogin(checked === true)}
                  />
                  <Label htmlFor="createLogin">Criar login para o membro</Label>
                </div>

                {createLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">Email de Login</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userPassword">Senha</Label>
                      <Input
                        id="userPassword"
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Senha"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex justify-between items-center gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevTab}
            disabled={isFirstTab}
          >
            Anterior
          </Button>

          {isLastTab ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          ) : (
            <Button type="button" onClick={goToNextTab}>
              Próximo
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
import { memberSchema, type MemberFormData } from "@/validators/member"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, X, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { sanitizeMemberForForm } from "@/lib/sanitize"

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: member, isLoading: memberLoading } = api.member.getById.useQuery({ id: Number(id) }, { enabled: !!id })

  const { data: allMinistries = [] } = api.ministry.getAll.useQuery()
  const { data: allFunctions = [] } = api.functions.getAll.useQuery()

  const updateMember = api.member.update.useMutation({
    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!")
      router.push("/admin/members")
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar membro")
    },
  })

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? sanitizeMemberForForm(member) : undefined,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ministries",
  })

  useEffect(() => {
    if (member && !memberLoading) {
      form.reset(sanitizeMemberForForm(member))
    }
  }, [member, memberLoading, form])

  function onSubmit(data: MemberFormData) {
    updateMember.mutate({
      id: Number(id),
      data,
    })
  }

  if (memberLoading || !member) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Editar Membro</h1>
          <p className="text-muted-foreground">
            Atualize as informações de {member.firstName} {member.lastName}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input id="firstName" {...form.register("firstName")} placeholder="Nome" />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input id="lastName" {...form.register("lastName")} placeholder="Sobrenome" />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} placeholder="email@exemplo.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...form.register("phone")} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...form.register("birthDate")} />
              </div>

              <div className="space-y-2">
                <Label>Gênero</Label>
                <Controller
                  name="gender"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={(value) => field.onChange(value || undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado Civil</Label>
                <Controller
                  name="maritalStatus"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value || "single"} onValueChange={field.onChange}>
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
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input id="profession" {...form.register("profession")} placeholder="Profissão" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...form.register("whatsapp")} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                <Input id="emergencyContact" {...form.register("emergencyContact")} placeholder="Nome do contato" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                <Input id="emergencyPhone" {...form.register("emergencyPhone")} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Textarea id="address" {...form.register("address")} placeholder="Rua, número, complemento" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" {...form.register("city")} placeholder="Cidade" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" {...form.register("state")} placeholder="SP" maxLength={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" {...form.register("zipCode")} placeholder="00000-000" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Igreja */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Igreja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberSince">Membro desde</Label>
                <Input id="memberSince" type="date" {...form.register("memberSince")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baptismDate">Data do Batismo</Label>
                <Input id="baptismDate" type="date" {...form.register("baptismDate")} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value || "active"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="visiting">Visitante</SelectItem>
                        <SelectItem value="transferred">Transferido</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Observações adicionais sobre o membro"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ministérios */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ministérios</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ministryId: 0, functionId: 0 })}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum ministério adicionado</p>
                <p className="text-sm">Clique em "Adicionar" para incluir ministérios</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ministério *</Label>
                        <Controller
                          name={`ministries.${index}.ministryId`}
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value?.toString() || ""}
                              onValueChange={(value) => field.onChange(Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o ministério" />
                              </SelectTrigger>
                              <SelectContent>
                                {allMinistries.map((ministry) => (
                                  <SelectItem key={ministry.id} value={ministry.id.toString()}>
                                    {ministry.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Controller
                          name={`ministries.${index}.functionId`}
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value === undefined ? "any" : String(field.value)}
                              onValueChange={(val) =>
                                field.onChange(val === "any" ? undefined : Number(val))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opcional" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Sem função</SelectItem>
                                {allFunctions.map((f) => (
                                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMember.isPending} className="bg-primary hover:bg-primary/90">
            {updateMember.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

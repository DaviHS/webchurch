"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api"
import { memberSchema } from "@/validators/member"
import { sanitizeMemberForForm } from "@/lib/sanitize"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type MemberFormData = z.infer<typeof memberSchema>

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {},
  })

  const { data: member, isLoading } = api.member.getById.useQuery({ id: Number(id) })
  const updateMember = api.member.update.useMutation()

  useEffect(() => {
    if (member) {
      form.reset(sanitizeMemberForForm(member))
    }
  }, [member])


  function onSubmit(data: MemberFormData) {
    updateMember.mutate(
      { id: Number(id), data },
      {
        onSuccess: () => router.push("/admin/members"),
      }
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Editar Membro</h1>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input {...form.register("firstName")} />
                </div>
                <div>
                  <Label>Sobrenome</Label>
                  <Input {...form.register("lastName")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input {...form.register("email")} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input {...form.register("phone")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gênero</Label>
                  <Select
                    value={form.watch("gender") || ""}
                    onValueChange={(val) => form.setValue("gender", val as "male" | "female")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(val) => form.setValue("status", val as MemberFormData["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="visiting">Visitante</SelectItem>
                      <SelectItem value="transferred">Transferido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea {...form.register("notes")} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMember.isPending}>
            {updateMember.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      )}
    </div>
  )
}

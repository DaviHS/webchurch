"use client"

import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: member, isLoading } = api.member.getById.useQuery({
    id: Number(id),
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      visiting: "bg-blue-100 text-blue-800",
      transferred: "bg-yellow-100 text-yellow-800",
    }

    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      visiting: "Visitante",
      transferred: "Transferido",
    }

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  if (isLoading || !member) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-muted-foreground">Perfil do membro</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/admin/members/${member.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground text-sm">{member.email || "—"}</p>
            </div>
            <div>
              <p className="font-medium">Telefone</p>
              <p className="text-muted-foreground text-sm">{member.phone || "—"}</p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              {getStatusBadge(member.status)}
            </div>
            <div>
              <p className="font-medium">Gênero</p>
              <p className="text-muted-foreground text-sm">
                {member.gender === "male" ? "Masculino" : "Feminino"}
              </p>
            </div>
            <div>
              <p className="font-medium">Nascimento</p>
              <p className="text-muted-foreground text-sm">
                {member.birthDate
                  ? new Date(member.birthDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="font-medium">Membro desde</p>
              <p className="text-muted-foreground text-sm">
                {member.memberSince
                  ? new Date(member.memberSince).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium mb-1">Endereço</p>
            <p className="text-muted-foreground text-sm">
              {member.address || "—"}, {member.city || "—"} - {member.state || "—"},{" "}
              {member.zipCode || "—"}
            </p>
          </div>

          {member.ministries?.length > 0 && (
            <div>
              <p className="font-medium mb-1">Ministérios</p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                {member.ministries.map((m, idx) => (
                  <li key={idx}>
                    {m.ministryName}
                    {m.functionName ? ` — ${m.functionName}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

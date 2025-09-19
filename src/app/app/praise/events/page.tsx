"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { api } from "@/trpc/react";
import { Plus, Search } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");

  const { data, isLoading } = api.event.list.useQuery({

    type: type || undefined,
    page,
    limit: 10,
  });

  const columns = [
    {
      header: "Título",
      accessorKey: "title",
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (info: any) => {
        const types = {
          cult: "Culto",
          celebration: "Celebração",
          meeting: "Reunião",
          conference: "Conferência",
          other: "Outro"
        };
        return types[info.getValue() as keyof typeof types] || info.getValue();
      }
    },
    {
      header: "Data",
      accessorKey: "date",
      cell: (info: any) => new Date(info.getValue()).toLocaleDateString('pt-BR')
    },
    {
      header: "Local",
      accessorKey: "location",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Eventos</h1>
        <Button onClick={() => router.push("/app/praise/events/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="cult">Culto</option>
              <option value="celebration">Celebração</option>
              <option value="meeting">Reunião</option>
              <option value="conference">Conferência</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.events || []}
            loading={isLoading}
            pagination={{
              currentPage: page,
              totalPages: data?.totalPages || 1,
              onPageChange: setPage,
              totalItems: data?.total || 0,
            }}
            onRowClick={(row) => router.push(`/app/praise/events/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
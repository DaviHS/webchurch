"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { api } from "@/trpc/react";
import { Plus, Search } from "lucide-react";

export default function SongsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");

  const { data, isLoading } = api.song.list.useQuery({
    search,
    category: category || undefined,
    page,
    limit: 10,
  });

  const columns = [
    {
      header: "Título",
      accessorKey: "title",
    },
    {
      header: "Artista",
      accessorKey: "artist",
    },
    {
      header: "Categoria",
      accessorKey: "category",
      cell: (info: any) => {
        const categories = {
          hymn: "Hino",
          praise: "Louvor",
          worship: "Adoração",
          chorus: "Coro",
          special: "Especial"
        };
        return categories[info.getValue() as keyof typeof categories] || info.getValue();
      }
    },
    {
      header: "Duração",
      accessorKey: "duration",
      cell: (info: any) => {
        const duration = info.getValue();
        return duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : "-";
      }
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Músicas</h1>
        <Button onClick={() => router.push("/praise/songs/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Música
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas categorias</option>
              <option value="hymn">Hino</option>
              <option value="praise">Louvor</option>
              <option value="worship">Adoração</option>
              <option value="chorus">Coro</option>
              <option value="special">Especial</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.songs || []}
            loading={isLoading}
            pagination={{
              currentPage: page,
              totalPages: data?.totalPages || 1,
              onPageChange: setPage,
              totalItems: data?.total || 0,
            }}
            onRowClick={(row) => router.push(`/praise/songs/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
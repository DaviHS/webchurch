"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export default function EventTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: templates, isLoading } = api.event.getTemplates.useQuery();

  const createTemplate = api.event.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
    },
  });

  const useTemplate = api.event.useTemplate.useMutation({
    onSuccess: (event) => {
      toast.success("Evento criado a partir do template!");
      router.push(`/praise/events/${event!.id}`);
    },
  });

  if (isLoading) return <div>Carregando templates...</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Templates de Eventos</h1>
        <Button onClick={() => createTemplate.mutate()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-6">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{template.title}</CardTitle>
              <Button
                onClick={() => useTemplate.mutate(template.id)}
                disabled={useTemplate.isPending}
              >
                <Copy className="mr-2 h-4 w-4" />
                Usar Template
              </Button>
            </CardHeader>
            <CardContent>
              <p>{template.description}</p>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Músicas:</h4>
                {template.songs.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {index + 1}. {item.song?.title ?? "Título não disponível"}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
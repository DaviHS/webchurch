"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { EventForm } from "../../_components/form";
import { use } from "react";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use o hook use para resolver a Promise
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const router = useRouter();
  const { data: event, isLoading } = api.event.getById.useQuery(eventId);
  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      router.push("/app/praise/events");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });

  if (isLoading) return <div>Carregando...</div>;
  if (!event) return <div>Evento não encontrado</div>;

  // Garantir que a data seja um objeto Date válido
  const initialData = {
    ...event,
    date: new Date(event.date),
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    startTime: event.startTime ?? undefined,
    endTime: event.endTime ?? undefined,
    preacher: event.preacher ?? undefined,
    bibleVerse: event.bibleVerse ?? undefined,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/app/praise/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Editar Evento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar {event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={(data) => updateEvent.mutate({ id: eventId, data })}
            initialData={initialData}
            isLoading={updateEvent.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
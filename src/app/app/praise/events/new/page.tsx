"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { EventForm } from "../_components/form";

export default function NewEventPage() {
  const router = useRouter();
  const createEvent = api.event.create.useMutation({
    onSuccess: (event) => {
      toast.success("Evento criado com sucesso!");
      router.push(`/app/praise/events/${event!.id!}`);
    },
    onError: (error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/app/praise/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Novo Evento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={(data) => createEvent.mutate(data)}
            isLoading={createEvent.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
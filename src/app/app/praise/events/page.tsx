"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { EventFormData } from "@/validators/event";
import { EventDialog } from "./_components/event-dialog";
import { EventDetailDialog } from "./_components/event-detail-dialog";
import { EventFilters } from "./_components/event-filters";
import { EventsGrid } from "./_components/events-grid";

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data, isLoading, refetch } = api.event.list.useQuery({
    type: type || undefined,
    page,
    limit: 20,
  });

  const { data: eventDetails, isLoading: isLoadingDetails } = api.event.getById.useQuery(
    selectedEvent?.id || 0,
    {
      enabled: !!selectedEvent?.id,
    }
  );

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      setIsDialogOpen(false);
      setEditingEvent(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: EventFormData) => {
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data });
    } else {
      createEvent.mutate(data);
    }
  };

  const handleDelete = (event: any) => {
    if (confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
      deleteEvent.mutate(event.id);
    }
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const eventToDisplay = eventDetails || selectedEvent;

  return (
    <div className="container mx-auto py-4">
      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingEvent}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      {eventToDisplay && (
        <EventDetailDialog
          event={eventToDisplay}
          open={detailDialogOpen}
          onOpenChange={(open) => {
            setDetailDialogOpen(open);
            if (!open) {
              setSelectedEvent(null);
            }
          }}
          isLoading={isLoadingDetails}
        />
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Eventos</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <EventFilters
              search={search}
              onSearchChange={setSearch}
              type={type}
              onTypeChange={setType}
            />
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <EventsGrid
            events={data?.events || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
          />
          
          {(!data?.events || data.events.length === 0) && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro evento
              </Button>
            </div>
          )}
          
          {data && data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {data.events.length} de {data.total} eventos
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Página {page} de {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
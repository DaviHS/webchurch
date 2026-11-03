"use client";

import { useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/trpc/react";
import { Calendar, Plus, SearchX } from "lucide-react";
import { toast } from "sonner";
import type { EventFormData } from "@/validators/event";
import type { EventData } from "@/types";
import { EventDialog } from "./_components/event-dialog";
import { EventDetailDialog } from "./_components/event-detail-dialog";
import { EventFilters } from "./_components/event-filters";
import { EventsGrid } from "./_components/events-grid";
import { SongPagination } from "../songs/_components/song-pagination";

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const createRequest = useCreateRequest();
  const dialogOpen = isDialogOpen || createRequest.requested;
  const setDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) createRequest.dismiss();
  };
  const isFiltered = debouncedSearch !== "" || (type !== "" && type !== "any");

  const { data, isLoading, refetch } = api.event.list.useQuery({
    type: type && type !== "any" ? type : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  const { data: eventDetails, isLoading: isLoadingDetails } = api.event.getById.useQuery(
    selectedEvent ? selectedEvent.id : skipToken
  );

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      setDialogOpen(false);
      void refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      setDialogOpen(false);
      setEditingEvent(null);
      void refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento excluído com sucesso!");
      void refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });

  const handleEdit = (event: EventData) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (formData: EventFormData) => {
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEvent.mutate(formData);
    }
  };

  const handleDelete = (event: EventData) => {
    if (confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
      deleteEvent.mutate(event.id);
    }
  };

  const events = data?.events ?? [];
  const eventToDisplay = eventDetails ?? selectedEvent;

  return (
    <PageContainer>
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingEvent}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      {eventToDisplay && (
        <EventDetailDialog
          event={eventToDisplay}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
          isLoading={isLoadingDetails}
        />
      )}

      <PageHeader
        title="Eventos"
        icon={Calendar}
        description="Cultos, ensaios e demais eventos com o repertório de cada um."
        actions={
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <EventFilters
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            type={type}
            onTypeChange={(value) => {
              setType(value);
              setPage(1);
            }}
          />
        </CardHeader>

        <CardContent>
          {!isLoading && events.length === 0 ? (
            isFiltered ? (
              <EmptyState
                icon={SearchX}
                title="Nenhum evento encontrado"
                description="Tente buscar por outro termo ou trocar o tipo."
              />
            ) : (
              <EmptyState
                icon={Calendar}
                title="Nenhum evento cadastrado"
                description="Crie o primeiro evento para montar o repertório."
                action={
                  <Button variant="outline" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo evento
                  </Button>
                }
              />
            )
          ) : (
            <>
              <EventsGrid
                events={events}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={setSelectedEvent}
                isLoading={isLoading}
              />

              <SongPagination
                page={page}
                totalPages={data?.totalPages ?? 1}
                total={data?.total ?? 0}
                showing={events.length}
                onPageChange={setPage}
                itemLabel="eventos"
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

"use client";

import { useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { Calendar, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { EventFormData } from "@/validators/event";
import type { EventData } from "@/types";
import { EventDetailDialog } from "./_components/event-detail-dialog";
import { EventDialog } from "./_components/event-dialog";
import { EventFilters } from "./_components/event-filters";
import { EventGrid } from "./_components/event-grid";

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const confirm = useConfirm();
  const utils = api.useUtils();
  const eventDialog = useEntityDialog<EventData>({ fromUrl: true });
  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = debouncedSearch !== "" || (type !== "" && type !== "any");

  const { data, isLoading, refetch } = api.event.list.useQuery({
    type: type && type !== "any" ? type : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  }, { placeholderData: (previous) => previous });

  const { data: eventDetails, isLoading: isLoadingDetails } = api.event.getById.useQuery(
    selectedEvent ? selectedEvent.id : skipToken
  );

  const createEventMutation = api.event.create.useMutation(
    mutationFeedback({
      success: "Evento criado com sucesso",
      error: "Erro ao criar evento",
      onSuccess: () => {
        eventDialog.close();
        return refetch();
      },
    })
  );

  const updateEventMutation = api.event.update.useMutation(
    mutationFeedback({
      success: "Evento atualizado com sucesso",
      error: "Erro ao atualizar evento",
      onSuccess: () => {
        eventDialog.close();
        return Promise.all([refetch(), utils.event.getById.invalidate()]);
      },
    })
  );

  const deleteEventMutation = api.event.delete.useMutation(
    mutationFeedback({
      success: "Evento excluído com sucesso",
      error: "Erro ao excluir evento",
      onSuccess: () => refetch(),
    })
  );

  const handleSubmit = (formData: EventFormData) => {
    if (eventDialog.editing) {
      updateEventMutation.mutate({ id: eventDialog.editing.id, data: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleDelete = async (event: EventData) => {
    const confirmed = await confirm({
      title: "Excluir evento?",
      description: `O evento "${event.title}" será excluído permanentemente.`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (confirmed) deleteEventMutation.mutate(event.id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setPage(1);
  };

  const events = data?.events ?? [];
  const eventToDisplay = eventDetails ?? selectedEvent;

  return (
    <PageContainer>
      <EventDialog
        open={eventDialog.open}
        onOpenChange={eventDialog.onOpenChange}
        onSubmit={handleSubmit}
        initialData={eventDialog.editing}
        isLoading={createEventMutation.isPending || updateEventMutation.isPending}
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
          <Button onClick={eventDialog.openCreate} className="w-full sm:w-auto">
            <Plus />
            Novo evento
          </Button>
        }
      />

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <EventFilters
            search={search}
            onSearchChange={handleSearchChange}
            type={type}
            onTypeChange={handleTypeChange}
            isSearching={search !== debouncedSearch}
          />
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
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
                  <Button variant="outline" onClick={eventDialog.openCreate}>
                    <Plus />
                    Novo evento
                  </Button>
                }
              />
            )
          ) : (
            <>
              <EventGrid
                events={events}
                onEdit={eventDialog.openEdit}
                onDelete={handleDelete}
                onViewDetails={setSelectedEvent}
                isLoading={isLoading}
              />

              <PaginationBar
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

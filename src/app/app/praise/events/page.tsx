"use client";

import { formatDate } from "@/lib/formatters";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useState } from "react";
import { addDays, getDay, startOfDay } from "date-fns";
import { skipToken } from "@tanstack/react-query";
import { Calendar, CalendarDays, List, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/hooks/use-debounce";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { EventFormData } from "@/validators/event";
import type { EventData } from "@/types";
import { EventDetailDialog } from "./_components/event-detail-dialog";
import { EventDialog } from "./_components/event-dialog";
import { EventFilters, type EventScope } from "./_components/event-filters";
import { PrintRepertoireDialog } from "./_components/print-repertoire-dialog";
import { EventCalendar } from "./_components/event-calendar";
import { NextEventCard } from "./_components/next-event-card";
import { EventGrid } from "./_components/event-grid";

export default function EventsPage() {
  const canEdit = usePermissions().can("events.edit");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  // Dia tocado no calendário para criar um evento (vira a data inicial do formulário).
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [printEventId, setPrintEventId] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [chosenScope, setChosenScope] = useState<EventScope | null>(null);
  const [today] = useState(() => startOfDay(new Date()));

  // Sem escolha da pessoa, abre em "Próximos" se houver algum evento daqui para a frente; senão, em "Passados".
  const upcomingProbe = api.event.list.useQuery({ scope: "upcoming", today, limit: 1 }, { staleTime: 60_000 });
  const scopeKnown = chosenScope !== null || upcomingProbe.isSuccess || upcomingProbe.isError;
  const scope: EventScope = chosenScope ?? (upcomingProbe.data?.total === 0 ? "past" : "upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const confirm = useConfirm();
  const utils = api.useUtils();
  const eventDialog = useEntityDialog<EventData>({ fromUrl: true });
  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = debouncedSearch !== "" || (type !== "" && type !== "any");

  const { data, isLoading, isError, error: listError, refetch } = api.event.list.useQuery({
    type: type && type !== "any" ? type : undefined,
    search: debouncedSearch || undefined,
    scope,
    today,
    page,
    limit: 20,
  }, { placeholderData: (previous) => previous, enabled: scopeKnown });

  const { data: availableTypes = [] } = api.event.typesInScope.useQuery({ scope, today }, { enabled: scopeKnown, staleTime: 60_000 });

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

  const duplicateEventMutation = api.event.duplicate.useMutation(
    mutationFeedback({
      success: (copy) => `Evento duplicado para ${formatDate(copy.date)}. Ajuste a data se precisar.`,
      error: "Erro ao duplicar o evento",
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

  const handleCreate = () => {
    setCreateDate(null);
    eventDialog.openCreate();
  };

  const handleCreateOnDate = (date: Date) => {
    setCreateDate(date);
    eventDialog.openCreate();
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

  const handleScopeChange = (value: EventScope) => {
    setChosenScope(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setPage(1);
  };

  const events = data?.events ?? [];
  const isPast = scope === "past";
  // O próximo evento vira um destaque no topo (só na primeira página e sem filtros); o resto vem na grade.
  const featured = scope === "upcoming" && page === 1 && !isFiltered ? events[0] : undefined;
  const gridEvents = featured ? events.slice(1) : events;

  // Evento novo já sugere o próximo domingo e repete o horário e o local do último culto da lista.
  const lastCult = events.find((event) => event.type === "cult");
  const nextSunday = addDays(today, (7 - getDay(today)) % 7);
  const createDefaults = {
    type: "cult" as const,
    date: createDate ?? nextSunday,
    startTime: lastCult?.startTime ?? "",
    endTime: lastCult?.endTime ?? "",
    location: lastCult?.location ?? "",
  };
  const eventToDisplay = eventDetails ?? selectedEvent;

  return (
    <PageContainer>
      <EventDialog
        open={eventDialog.open && canEdit}
        onOpenChange={eventDialog.onOpenChange}
        onSubmit={handleSubmit}
        initialData={eventDialog.editing}
        defaults={createDefaults}
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

      <PrintRepertoireDialog eventId={printEventId} open={printEventId !== null} onOpenChange={(open) => !open && setPrintEventId(null)} />

      <PageHeader
        title="Eventos"
        icon={Calendar}
        description="Cultos, ensaios e demais eventos com o repertório de cada um."
        actions={
          canEdit ? (
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus />
              Novo evento
            </Button>
          ) : undefined
        }
      />

      <div role="radiogroup" aria-label="Forma de ver os eventos" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:w-64">
        {(["list", "calendar"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={view === option}
            onClick={() => setView(option)}
            className={cn(
              "flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
              view === option ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "list" ? <List className="size-4" /> : <CalendarDays className="size-4" />}
            {option === "list" ? "Lista" : "Calendário"}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <EventCalendar
          onViewDetails={setSelectedEvent}
          onCreateOnDate={canEdit ? handleCreateOnDate : undefined}
        />
      ) : (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
            <EventFilters
              scope={scope}
              onScopeChange={handleScopeChange}
              search={search}
              onSearchChange={handleSearchChange}
              type={type}
              onTypeChange={handleTypeChange}
              isSearching={search !== debouncedSearch}
              availableTypes={availableTypes}
            />
          </CardHeader>

          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            {isError && !data ? (
              <ErrorDisplay title="Não foi possível carregar os eventos" message={listError.message} onRetry={() => void refetch()} className="mt-0" />
            ) : !isLoading && events.length === 0 ? (
              isFiltered ? (
                <EmptyState
                  icon={SearchX}
                  title="Nenhum evento encontrado"
                  description="Tente buscar por outro termo ou trocar o tipo."
                />
              ) : (
                <EmptyState
                  icon={Calendar}
                  title={isPast ? "Nenhum evento passado" : "Nenhum evento a partir de hoje"}
                  description={
                    isPast
                      ? "Os eventos que já aconteceram aparecem aqui."
                      : canEdit
                        ? "Crie um evento ou duplique o último culto para montar o repertório."
                        : "Ainda não há eventos marcados."
                  }
                  action={
                    canEdit ? (
                      <Button variant="outline" onClick={handleCreate}>
                        <Plus />
                        Novo evento
                      </Button>
                    ) : undefined
                  }
                />
              )
            ) : (
              <>
                {featured && <NextEventCard event={featured} onViewDetails={setSelectedEvent} />}

                <EventGrid
                  events={gridEvents}
                  isPast={isPast}
                  onEdit={eventDialog.openEdit}
                  onDelete={handleDelete}
                  onViewDetails={setSelectedEvent}
                  onDuplicate={(event) => duplicateEventMutation.mutate(event.id)}
                onPrint={(event) => setPrintEventId(event.id)}
                  isLoading={isLoading || !scopeKnown}
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
      )}
    </PageContainer>
  );
}

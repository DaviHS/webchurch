"use client";

import { endOfDay, isValid, startOfDay } from "date-fns";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { type EventFormData, type EventFormInput, eventSchema, eventTypes } from "@/validators/event";
import type { EventData } from "@/types";
import { eventTypeLabel, SELECTABLE_EVENT_TYPES } from "@/lib/labels";
import { formatTime } from "@/lib/formatters";
import { api } from "@/trpc/react";

interface EventFormProps {
  id: string;
  onSubmit: (data: EventFormData) => void;
  initialData?: EventData | null;
  /** Valores sugeridos para um evento novo (próximo domingo, horário e local do último culto). */
  defaults?: Partial<EventFormInput>;
}

function toFormValues(event: EventData | null | undefined, defaults?: Partial<EventFormInput>): EventFormInput {
  return {
    title: event?.title ?? defaults?.title ?? "",
    description: event?.description ?? "",
    type: event?.type ?? defaults?.type ?? "cult",
    date: event?.date ? new Date(event.date) : (defaults?.date ?? new Date()),
    startTime: event?.startTime ?? defaults?.startTime ?? "",
    endTime: event?.endTime ?? defaults?.endTime ?? "",
    location: event?.location ?? defaults?.location ?? "",
    preacher: event?.preacher ?? "",
    bibleVerse: event?.bibleVerse ?? "",
  };
}

const DEFAULT_DURATION_MIN = 120;

function toMinutes(time: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Avisa (sem bloquear) quando já existe outro evento no mesmo dia, com destaque para horário sobreposto. */
function ConflictWarning({ control, excludeId }: { control: Control<EventFormInput>; excludeId?: number }) {
  const [date, startTime, endTime] = useWatch({ control, name: ["date", "startTime", "endTime"] });
  const day = date ? new Date(date) : null;
  const valid = day !== null && isValid(day);

  const { data } = api.event.list.useQuery(
    { startDate: valid ? startOfDay(day) : undefined, endDate: valid ? endOfDay(day) : undefined, limit: 20 },
    { enabled: valid, staleTime: 30_000 },
  );

  const start = toMinutes(startTime);
  const end = toMinutes(endTime) ?? (start === null ? null : start + DEFAULT_DURATION_MIN);

  const others = (data?.events ?? []).filter((event) => event.type !== "template" && event.id !== excludeId);
  if (others.length === 0) return null;

  const describe = (event: (typeof others)[number]) => {
    const otherStart = toMinutes(event.startTime);
    const otherEnd = toMinutes(event.endTime) ?? (otherStart === null ? null : otherStart + DEFAULT_DURATION_MIN);
    const overlaps = start !== null && end !== null && otherStart !== null && otherEnd !== null && start < otherEnd && otherStart < end;
    const when = event.startTime ? ` às ${formatTime(event.startTime)}` : "";
    return { id: event.id, text: `${event.title}${when}`, overlaps };
  };
  const items = others.map(describe);
  const anyOverlap = items.some((item) => item.overlaps);

  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${anyOverlap ? "border-destructive/50 bg-destructive/10" : "border-warning/50 bg-warning/10"}`}
    >
      <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${anyOverlap ? "text-destructive" : "text-warning"}`} />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">{anyOverlap ? "Horário sobreposto a outro evento" : "Já há evento neste dia"}</p>
        <ul className="text-muted-foreground">
          {items.map((item) => (
            <li key={item.id} className="break-words">
              {item.text}
              {item.overlaps && " (sobrepõe)"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EventForm({ id, onSubmit, initialData, defaults }: EventFormProps) {
  const form = useForm<EventFormInput, unknown, EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: toFormValues(initialData, defaults),
  });

  const typeOptions = initialData?.type === "template" ? eventTypes : SELECTABLE_EVENT_TYPES;
  // Pregador, versículo e descrição ficam recolhidos num evento novo, mas abertos ao editar se já tiverem algo.
  const hasDetails = Boolean(initialData?.preacher ?? initialData?.bibleVerse ?? initialData?.description);

  return (
    <Form {...form}>
      <form id={id} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {eventTypeLabel(eventType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => field.onChange(date ?? "")}
                    placeholder="Selecione uma data"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de início</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de término</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-2 empty:hidden">
            <ConflictWarning control={form.control} excludeId={initialData?.id} />
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Collapsible defaultOpen={hasDetails} className="rounded-md border">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between px-3 text-sm font-medium">
            Mais detalhes
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 border-t p-3">
              <FormField
                control={form.control}
                name="preacher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pregador</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bibleVerse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versículo bíblico</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: João 3:16" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </Form>
  );
}

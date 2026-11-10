"use client";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { EventFormData, EventFormInput } from "@/validators/event";
import type { EventData } from "@/types";
import { EventForm } from "./event-form";

const EVENT_FORM_ID = "event-form";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  initialData?: EventData | null;
  isLoading?: boolean;
  defaults?: Partial<EventFormInput>;
}

export function EventDialog({ open, onOpenChange, onSubmit, initialData, isLoading = false, defaults }: EventDialogProps) {
  const isEditing = Boolean(initialData);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Editar evento" : "Novo evento"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditing ? "Atualize as informações do evento." : "Preencha as informações do novo evento."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="pb-4">
          <EventForm key={initialData?.id ?? "new"} id={EVENT_FORM_ID} onSubmit={onSubmit} initialData={initialData} defaults={defaults} />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </ResponsiveDialogClose>
          <Button type="submit" form={EVENT_FORM_ID} disabled={isLoading}>
            {isLoading ? "Salvando…" : isEditing ? "Salvar" : "Criar evento"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

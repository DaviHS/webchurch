// app/praise/events/_components/event-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventForm } from "./form";
import type { EventFormData } from "@/validators/event";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function EventDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {initialData ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>
        <EventForm
          onSubmit={onSubmit}
          initialData={initialData}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
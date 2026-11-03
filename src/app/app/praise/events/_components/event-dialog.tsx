import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventForm } from "./form";
import type { EventFormData } from "@/validators/event";
import type { EventData } from "@/types";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  initialData?: EventData | null;
  isLoading?: boolean;
}

export function EventDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {initialData ? "Editar evento" : "Novo evento"}
          </DialogTitle>
        </DialogHeader>
        <EventForm
          key={initialData?.id ?? "new"}
          onSubmit={onSubmit}
          initialData={initialData}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

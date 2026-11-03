import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormDialogFooterActionsProps {
  isPending: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function FormDialogFooterActions({ isPending, submitLabel, onCancel }: FormDialogFooterActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
        <X />
        Cancelar
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        {submitLabel}
      </Button>
    </>
  );
}

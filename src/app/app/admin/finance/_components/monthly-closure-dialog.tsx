import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MonthlyClosureForm } from "./monthly-closure-form";
import type { MonthlyClosureFormData } from "@/validators/finance";

interface MonthlyClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MonthlyClosureFormData) => void;
  isLoading?: boolean;
  currentMonth: number;
  currentYear: number;
}

export function MonthlyClosureDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  currentMonth, 
  currentYear 
}: MonthlyClosureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fechamento do Mês</DialogTitle>
          <DialogDescription>
            Realize o fechamento financeiro do mês selecionado. 
            Este processo calculará automaticamente o saldo final.
          </DialogDescription>
        </DialogHeader>
        <MonthlyClosureForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </DialogContent>
    </Dialog>
  );
}
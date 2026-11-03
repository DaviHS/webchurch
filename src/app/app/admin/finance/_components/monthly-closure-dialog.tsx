import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
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
  currentYear,
}: MonthlyClosureDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Fechamento do mês</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Realize o fechamento financeiro do mês selecionado. Este processo calculará automaticamente o saldo final.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <MonthlyClosureForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onCancel={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

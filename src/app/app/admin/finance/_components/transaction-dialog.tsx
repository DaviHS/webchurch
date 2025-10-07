import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "./transaction-form";
import type { FinancialTransactionFormData } from "@/validators/finance";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialTransactionFormData) => void;
  initialData?: any;
  isLoading?: boolean;
  categories: any[];
}

export function TransactionDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  isLoading, 
  categories 
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {initialData ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm
          onSubmit={onSubmit}
          initialData={initialData}
          isLoading={isLoading}
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
}
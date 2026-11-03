import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm, transactionToFormValues } from "./transaction-form";
import type { FinancialTransactionFormData } from "@/validators/finance";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transactions-list";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialTransactionFormData) => void;
  transaction: TransactionRow | null;
  isLoading?: boolean;
  categories: FinancialCategory[];
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  transaction,
  isLoading,
  categories,
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {transaction ? "Editar transação" : "Nova transação"}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm
          key={transaction?.transaction.id ?? "new"}
          onSubmit={onSubmit}
          initialData={transaction ? transactionToFormValues(transaction) : undefined}
          isLoading={isLoading}
          categories={categories}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

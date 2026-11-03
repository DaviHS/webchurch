import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { TransactionForm, transactionToFormValues } from "./transaction-form";
import type { FinancialTransactionFormData } from "@/validators/finance";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transaction-list";

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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{transaction ? "Editar transação" : "Nova transação"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <TransactionForm
          key={transaction?.transaction.id ?? "new"}
          onSubmit={onSubmit}
          initialData={transaction ? transactionToFormValues(transaction) : undefined}
          isLoading={isLoading}
          categories={categories}
          onCancel={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

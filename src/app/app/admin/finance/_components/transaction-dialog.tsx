"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { FinancialTransactionFormData } from "@/validators/finance";
import { TransactionForm, transactionToFormValues } from "./transaction-form";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transaction-list";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialTransactionFormData) => void;
  onManageCategories: () => void;
  transaction: TransactionRow | null;
  isLoading?: boolean;
  categories: FinancialCategory[];
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  onManageCategories,
  transaction,
  isLoading,
  categories,
}: TransactionDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <TransactionForm
          key={transaction?.transaction.id ?? "new"}
          onSubmit={onSubmit}
          initialData={transaction ? transactionToFormValues(transaction) : undefined}
          isLoading={isLoading}
          categories={categories}
          onCancel={() => onOpenChange(false)}
          onManageCategories={onManageCategories}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

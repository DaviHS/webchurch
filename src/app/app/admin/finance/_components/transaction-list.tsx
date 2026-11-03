"use client";

import { Pencil, Receipt, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { TRANSACTION_TYPES, amountClassName, formatCurrency, paymentMethodLabel, transactionTypeLabel } from "./format";

export type TransactionRow = RouterOutputs["finance"]["listTransactions"]["transactions"][number];

interface TransactionListProps {
  transactions: TransactionRow[];
  onEdit: (transaction: TransactionRow) => void;
  onDelete: (transaction: TransactionRow) => void;
  isLoading?: boolean;
  hasFilters?: boolean;
}

const typeVariant = (type: string) =>
  type === "income" || type === "expense" ? TRANSACTION_TYPES[type].variant : "outline";

export function TransactionList({ transactions, onEdit, onDelete, isLoading, hasFilters = false }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhum lançamento encontrado"
        description={hasFilters ? "Ajuste ou limpe os filtros para ver outros lançamentos." : "Comece registrando a primeira entrada ou saída."}
      />
    );
  }

  const actionsFor = (item: TransactionRow): RowAction[] => [
    { label: "Editar", icon: Pencil, onSelect: () => onEdit(item) },
    { label: "Excluir", icon: Trash2, destructive: true, onSelect: () => onDelete(item) },
  ];

  return (
    <>
      <ul className="divide-y md:hidden">
        {transactions.map((item) => {
          const { transaction, category } = item;
          const details = [formatDate(transaction.transactionDate), category?.name, paymentMethodLabel(transaction.paymentMethod)]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={transaction.id} className="flex items-start gap-2 py-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-words text-sm font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{details}</p>
                {transaction.referenceNumber && (
                  <p className="break-words text-xs text-muted-foreground">Ref.: {transaction.referenceNumber}</p>
                )}
              </div>
              <span className={cn("shrink-0 pt-0.5 text-sm font-semibold tabular-nums", amountClassName(transaction.type))}>
                {transaction.type === "expense" ? "− " : ""}
                {formatCurrency(transaction.amount)}
              </span>
              <RowActionsMenu label={`Ações do lançamento ${transaction.description}`} actions={actionsFor(item)} />
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Forma de pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[64px]">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => {
              const { transaction, category } = item;
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(transaction.transactionDate)}</TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="break-words font-medium">{transaction.description}</div>
                    {transaction.referenceNumber && (
                      <div className="text-xs text-muted-foreground">Ref.: {transaction.referenceNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>{category?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant(transaction.type)}>{transactionTypeLabel(transaction.type)}</Badge>
                  </TableCell>
                  <TableCell>{paymentMethodLabel(transaction.paymentMethod) ?? "—"}</TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", amountClassName(transaction.type))}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <RowActionsMenu label={`Ações do lançamento ${transaction.description}`} actions={actionsFor(item)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, User, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { formatDate, fullName } from "@/lib/formatters";
import type { RouterOutputs } from "@/types";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPES, amountClassName, formatCurrency } from "./format";

export type TransactionRow = RouterOutputs["finance"]["listTransactions"]["transactions"][number];

interface TransactionListProps {
  transactions: TransactionRow[];
  onEdit: (transaction: TransactionRow) => void;
  isLoading?: boolean;
  hasFilters?: boolean;
}

const getTypeVariant = (type: string) => TRANSACTION_TYPES[type]?.variant ?? "outline";

const getTypeText = (type: string) => TRANSACTION_TYPES[type]?.label ?? type;

const getPaymentMethodText = (method: string | null) =>
  method ? (PAYMENT_METHOD_LABELS[method] ?? method) : "-";

const getPaymentMethodIcon = (method: string | null) => {
  switch (method) {
    case "cash":
      return "💵";
    case "card":
      return "💳";
    case "transfer":
      return "🔄";
    case "check":
      return "📄";
    default:
      return "💰";
  }
};

export function TransactionList({ transactions, onEdit, isLoading, hasFilters = false }: TransactionListProps) {
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
        icon={CreditCard}
        title="Nenhuma transação encontrada"
        description={
          hasFilters
            ? "Ajuste ou limpe os filtros para ver outras transações."
            : "Comece criando sua primeira transação."
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {transactions.map((item) => {
          const { transaction, category, member } = item;
          return (
            <li key={transaction.id}>
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`Editar transação ${transaction.description}`}
                className="w-full space-y-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="break-words text-sm font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {formatDate(transaction.transactionDate)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-semibold tabular-nums ${amountClassName(transaction.type)}`}>
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {getPaymentMethodIcon(transaction.paymentMethod)} {getPaymentMethodText(transaction.paymentMethod)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={getTypeVariant(transaction.type)} className="text-xs">
                    {getTypeText(transaction.type)}
                  </Badge>
                  {category?.name && <span className="text-muted-foreground">{category.name}</span>}
                </div>

                {member && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    {fullName(member)}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 break-words">
                    {transaction.referenceNumber ? `Ref: ${transaction.referenceNumber}` : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
                    Editar
                    <ChevronRight className="size-4" />
                  </span>
                </div>
              </button>
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
              <TableHead>Membro</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[64px]">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => {
              const { transaction, category, member } = item;
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(transaction.transactionDate)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="space-y-1">
                      <div className="break-words font-medium">{transaction.description}</div>
                      {transaction.referenceNumber && (
                        <div className="text-xs text-muted-foreground">Ref: {transaction.referenceNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {category?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(transaction.type)}>{getTypeText(transaction.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {member ? (
                      <div className="text-sm">{fullName(member)}</div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                      <span className="text-sm">{getPaymentMethodText(transaction.paymentMethod)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    <span className={amountClassName(transaction.type)}>{formatCurrency(transaction.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <RowActionsMenu
                      label="Ações da transação"
                      actions={[{ label: "Editar", icon: Pencil, onSelect: () => onEdit(item) }]}
                    />
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

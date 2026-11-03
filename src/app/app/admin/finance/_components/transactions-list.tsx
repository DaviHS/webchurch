"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, User, Calendar, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RouterOutputs } from "@/types";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPES, amountClassName, formatCurrency } from "./format";

export type TransactionRow = RouterOutputs["finance"]["listTransactions"]["transactions"][number];

interface TransactionsListProps {
  transactions: TransactionRow[];
  onEdit: (transaction: TransactionRow) => void;
  isLoading?: boolean;
  hasFilters?: boolean;
}

const formatDate = (date: Date) => format(date, "dd/MM/yyyy", { locale: ptBR });

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

export function TransactionsList({ transactions, onEdit, isLoading, hasFilters = false }: TransactionsListProps) {
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
    <div className="border rounded-lg overflow-hidden">
      <div className="md:hidden space-y-4 p-4">
        {transactions.map((item) => {
          const { transaction, category, member } = item;
          return (
            <div key={transaction.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium text-sm">{transaction.description}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transaction.transactionDate)}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={getTypeVariant(transaction.type)} className="text-xs">
                      {getTypeText(transaction.type)}
                    </Badge>
                    <span className="text-muted-foreground">{category?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${amountClassName(transaction.type)}`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getPaymentMethodIcon(transaction.paymentMethod)} {getPaymentMethodText(transaction.paymentMethod)}
                  </div>
                </div>
              </div>

              {member && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {member.firstName} {member.lastName}
                </div>
              )}

              {transaction.referenceNumber && (
                <div className="text-xs text-muted-foreground">
                  Ref: {transaction.referenceNumber}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
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
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => {
              const { transaction, category, member } = item;
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(transaction.transactionDate)}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="space-y-1">
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.referenceNumber && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {transaction.referenceNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {category?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(transaction.type)}>
                      {getTypeText(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member ? (
                      <div className="text-sm">
                        {member.firstName} {member.lastName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                      <span className="text-sm">{getPaymentMethodText(transaction.paymentMethod)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={amountClassName(transaction.type)}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Ações da transação">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

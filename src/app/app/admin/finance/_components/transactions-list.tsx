"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, User, Calendar, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionsListProps {
  transactions: any[];
  onEdit: (transaction: any) => void;
  isLoading?: boolean;
}

export function TransactionsList({ transactions, onEdit, isLoading }: TransactionsListProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'income':
        return 'default';
      case 'expense':
        return 'destructive';
      case 'transfer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      case 'transfer':
        return 'Transferência';
      default:
        return type;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'transfer':
        return '🔄';
      case 'check':
        return '📄';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma transação encontrada</p>
          <p className="text-sm">Comece criando sua primeira transação</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile View */}
      <div className="md:hidden space-y-4 p-4">
        {transactions.map((item) => (
          <div key={item.transaction.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-sm">{item.transaction.description}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(item.transaction.transactionDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={getTypeVariant(item.transaction.type)} className="text-xs">
                    {getTypeText(item.transaction.type)}
                  </Badge>
                  <span className="text-muted-foreground">{item.category?.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  item.transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(item.transaction.amount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getPaymentMethodIcon(item.transaction.paymentMethod)} {item.transaction.paymentMethod}
                </div>
              </div>
            </div>
            
            {item.member && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {item.member.firstName} {item.member.lastName}
              </div>
            )}

            {item.transaction.referenceNumber && (
              <div className="text-xs text-muted-foreground">
                Ref: {item.transaction.referenceNumber}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
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
            {transactions.map((item) => (
              <TableRow key={item.transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(item.transaction.transactionDate), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    <div className="font-medium">{item.transaction.description}</div>
                    {item.transaction.referenceNumber && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {item.transaction.referenceNumber}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.category?.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeVariant(item.transaction.type)}>
                    {getTypeText(item.transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.member ? (
                    <div className="text-sm">
                      {item.member.firstName} {item.member.lastName}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{getPaymentMethodIcon(item.transaction.paymentMethod)}</span>
                    <span className="capitalize text-sm">{item.transaction.paymentMethod}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className={
                    item.transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }>
                    {formatCurrency(item.transaction.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
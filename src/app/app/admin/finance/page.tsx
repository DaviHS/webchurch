"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { TransactionDialog } from "./_components/transaction-dialog";
import { TransactionsList } from "./_components/transactions-list";
import { FinanceFilters } from "./_components/finance-filters";
import { MonthlyClosureDialog } from "./_components/monthly-closure-dialog";

export default function FinancePage() {
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    type: "",
    categoryId: undefined as number | undefined,
  });
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = api.finance.getFinancialSummary.useQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = api.finance.listTransactions.useQuery({
    ...filters,
    page: 1,
    limit: 50,
  });

  const { data: categories } = api.finance.listCategories.useQuery({});

  const createTransaction = api.finance.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transação registrada com sucesso!");
      setIsTransactionDialogOpen(false);
      refetchSummary();
      refetchTransactions();
    },
    onError: (error) => {
      toast.error("Erro ao registrar transação: " + error.message);
    },
  });

  const closeMonth = api.finance.closeMonth.useMutation({
    onSuccess: () => {
      toast.success("Mês fechado com sucesso!");
      setIsClosureDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao fechar mês: " + error.message);
    },
  });

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleSubmitTransaction = (data: any) => {
    createTransaction.mutate(data);
  };

  const handleCloseMonth = (data: any) => {
    closeMonth.mutate(data);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="container mx-auto py-4 space-y-6">
      <TransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        onSubmit={handleSubmitTransaction}
        initialData={editingTransaction}
        isLoading={createTransaction.isPending}
        categories={categories || []}
      />

      <MonthlyClosureDialog
        open={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        onSubmit={handleCloseMonth}
        isLoading={closeMonth.isPending}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground">Gerencie receitas, despesas e fechamentos mensais</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setIsClosureDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            Fechar Mês
          </Button>
          <Button onClick={handleCreateTransaction} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingSummary ? "..." : `R$ ${summary?.totalIncome.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingSummary ? "..." : `R$ ${summary?.totalExpenses.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {isLoadingSummary ? "..." : `R$ ${summary?.balance.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {((summary?.balance || 0) >= 0 ? 'Positivo' : 'Negativo')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FinanceFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories || []}
            />
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList
            transactions={transactionsData?.transactions || []}
            onEdit={handleEditTransaction}
            isLoading={isLoadingTransactions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
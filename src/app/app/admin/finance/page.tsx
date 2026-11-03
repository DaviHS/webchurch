"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { TransactionDialog } from "./_components/transaction-dialog";
import { TransactionsList, type TransactionRow } from "./_components/transactions-list";
import { FinanceFilters, emptyFinanceFilters, type FinanceFiltersState } from "./_components/finance-filters";
import { MonthlyClosureDialog } from "./_components/monthly-closure-dialog";
import type { FinancialTransactionFormData, MonthlyClosureFormData } from "@/validators/finance";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { balanceClassName, formatCurrency } from "./_components/format";

export default function FinancePage() {
  const [filters, setFilters] = useState<FinanceFiltersState>(emptyFinanceFilters);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);

  const utils = api.useUtils();

  const { data: summary, isLoading: isLoadingSummary } = api.finance.getFinancialSummary.useQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data: transactionsData, isLoading: isLoadingTransactions } = api.finance.listTransactions.useQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type === "" ? undefined : filters.type,
    categoryId: filters.categoryId,
    page: 1,
    limit: 50,
  });

  const { data: categories = [] } = api.finance.listCategories.useQuery({});

  const refreshTransactions = () =>
    Promise.all([
      utils.finance.getFinancialSummary.invalidate(),
      utils.finance.listTransactions.invalidate(),
      utils.finance.getMonthlyReport.invalidate(),
    ]);

  const createTransaction = api.finance.createTransaction.useMutation({
    onSuccess: async () => {
      toast.success("Transação criada com sucesso");
      setIsTransactionDialogOpen(false);
      await refreshTransactions();
    },
    onError: (error) => {
      toast.error(`Erro ao criar transação: ${error.message}`);
    },
  });

  const updateTransaction = api.finance.updateTransaction.useMutation({
    onSuccess: async () => {
      toast.success("Transação atualizada com sucesso");
      setIsTransactionDialogOpen(false);
      setEditingTransaction(null);
      await refreshTransactions();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar transação: ${error.message}`);
    },
  });

  const closeMonth = api.finance.closeMonth.useMutation({
    onSuccess: async () => {
      toast.success("Mês fechado com sucesso");
      setIsClosureDialogOpen(false);
      await Promise.all([utils.finance.getMonthlyClosures.invalidate(), utils.finance.getMonthlyReport.invalidate()]);
    },
    onError: (error) => {
      toast.error(`Erro ao fechar mês: ${error.message}`);
    },
  });

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: TransactionRow) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleSubmitTransaction = (data: FinancialTransactionFormData) => {
    if (editingTransaction) {
      updateTransaction.mutate({ ...data, id: editingTransaction.transaction.id });
    } else {
      createTransaction.mutate(data);
    }
  };

  const handleCloseMonth = (data: MonthlyClosureFormData) => {
    closeMonth.mutate(data);
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const search = filters.search.trim().toLocaleLowerCase("pt-BR");
  const allTransactions = transactionsData?.transactions ?? [];
  const visibleTransactions = search === ""
    ? allTransactions
    : allTransactions.filter(({ transaction }) =>
        transaction.description.toLocaleLowerCase("pt-BR").includes(search)
      );

  const balance = summary?.balance ?? 0;
  const hasFilters =
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.type !== "" ||
    filters.categoryId !== undefined ||
    search !== "";

  const summaryValue = (value: number | undefined) =>
    isLoadingSummary ? <Skeleton className="h-8 w-32" /> : formatCurrency(value);

  return (
    <PageContainer>
      <TransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        onSubmit={handleSubmitTransaction}
        transaction={editingTransaction}
        isLoading={createTransaction.isPending || updateTransaction.isPending}
        categories={categories}
      />

      <MonthlyClosureDialog
        open={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        onSubmit={handleCloseMonth}
        isLoading={closeMonth.isPending}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      <PageHeader
        title="Controle financeiro"
        description="Gerencie receitas, despesas e fechamentos mensais"
        icon={DollarSign}
        actions={
          <>
            <Button onClick={() => setIsClosureDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
              <Calendar className="mr-2 h-4 w-4" />
              Fechar mês
            </Button>
            <Button onClick={handleCreateTransaction} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova transação
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summaryValue(summary?.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summaryValue(summary?.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceClassName(balance)}`}>{summaryValue(summary?.balance)}</div>
            <p className="text-xs text-muted-foreground">
              {isLoadingSummary ? "Período selecionado" : balance >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinanceFilters filters={filters} onFiltersChange={setFilters} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas transações</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList
            transactions={visibleTransactions}
            onEdit={handleEditTransaction}
            isLoading={isLoadingTransactions}
            hasFilters={hasFilters}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
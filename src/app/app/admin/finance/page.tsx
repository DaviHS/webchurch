"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { TransactionDialog } from "./_components/transaction-dialog";
import { TransactionList, type TransactionRow } from "./_components/transaction-list";
import {
  FinanceFilters,
  emptyFinanceFilters,
  hasActiveFinanceFilters,
  type FinanceFiltersState,
} from "./_components/finance-filters";
import { MonthlyClosureDialog } from "./_components/monthly-closure-dialog";
import type { FinancialTransactionFormData, MonthlyClosureFormData } from "@/validators/finance";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { balanceClassName, formatCurrency } from "./_components/format";

export default function FinancePage() {
  const [filters, setFilters] = useState<FinanceFiltersState>(emptyFinanceFilters);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const transactionDialog = useEntityDialog<TransactionRow>();

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

  const createTransactionMutation = api.finance.createTransaction.useMutation(
    mutationFeedback({
      success: "Transação criada com sucesso",
      error: "Erro ao criar transação",
      onSuccess: async () => {
        transactionDialog.close();
        await refreshTransactions();
      },
    })
  );

  const updateTransactionMutation = api.finance.updateTransaction.useMutation(
    mutationFeedback({
      success: "Transação atualizada com sucesso",
      error: "Erro ao atualizar transação",
      onSuccess: async () => {
        transactionDialog.close();
        await refreshTransactions();
      },
    })
  );

  const closeMonthMutation = api.finance.closeMonth.useMutation(
    mutationFeedback({
      success: "Mês fechado com sucesso",
      error: "Erro ao fechar mês",
      onSuccess: async () => {
        setIsClosureDialogOpen(false);
        await Promise.all([utils.finance.listMonthlyClosures.invalidate(), utils.finance.getMonthlyReport.invalidate()]);
      },
    })
  );

  const handleSubmitTransaction = (data: FinancialTransactionFormData) => {
    const { editing } = transactionDialog;
    if (editing) {
      updateTransactionMutation.mutate({ ...data, id: editing.transaction.id });
    } else {
      createTransactionMutation.mutate(data);
    }
  };

  const handleCloseMonth = (data: MonthlyClosureFormData) => {
    closeMonthMutation.mutate(data);
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const search = filters.search.trim().toLocaleLowerCase("pt-BR");
  const allTransactions = transactionsData?.transactions ?? [];
  const visibleTransactions =
    search === ""
      ? allTransactions
      : allTransactions.filter(({ transaction }) => transaction.description.toLocaleLowerCase("pt-BR").includes(search));

  const balance = summary?.balance ?? 0;

  return (
    <PageContainer>
      <TransactionDialog
        open={transactionDialog.open}
        onOpenChange={transactionDialog.onOpenChange}
        onSubmit={handleSubmitTransaction}
        transaction={transactionDialog.editing}
        isLoading={createTransactionMutation.isPending || updateTransactionMutation.isPending}
        categories={categories}
      />

      <MonthlyClosureDialog
        open={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        onSubmit={handleCloseMonth}
        isLoading={closeMonthMutation.isPending}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      <PageHeader
        title="Finanças"
        description="Gerencie receitas, despesas e fechamentos mensais"
        icon={DollarSign}
        actions={
          <>
            <Button onClick={() => setIsClosureDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
              <Calendar />
              Fechar mês
            </Button>
            <Button onClick={transactionDialog.openCreate} className="w-full sm:w-auto">
              <Plus />
              Nova transação
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total de receitas"
          value={formatCurrency(summary?.totalIncome)}
          description="Período selecionado"
          icon={TrendingUp}
          isLoading={isLoadingSummary}
          valueClassName="text-success"
          iconClassName="text-success"
        />
        <StatCard
          title="Total de despesas"
          value={formatCurrency(summary?.totalExpenses)}
          description="Período selecionado"
          icon={TrendingDown}
          isLoading={isLoadingSummary}
          valueClassName="text-destructive"
          iconClassName="text-destructive"
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(summary?.balance)}
          description={isLoadingSummary ? "Período selecionado" : balance >= 0 ? "Positivo" : "Negativo"}
          icon={DollarSign}
          isLoading={isLoadingSummary}
          valueClassName={balanceClassName(balance)}
          iconClassName="text-info"
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <FinanceFilters filters={filters} onFiltersChange={setFilters} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Últimas transações</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <TransactionList
            transactions={visibleTransactions}
            onEdit={transactionDialog.openEdit}
            isLoading={isLoadingTransactions}
            hasFilters={hasActiveFinanceFilters(filters)}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

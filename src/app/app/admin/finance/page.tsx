"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { FinancialTransactionFormData } from "@/validators/finance";
import { CategoryManager } from "./_components/category-manager";
import { ClosureList } from "./_components/closure-list";
import { emptyFinanceFilters, type FinanceFiltersState } from "./_components/finance-filters";
import { currentMonthRef, type MonthRef } from "./_components/format";
import { MonthSummary } from "./_components/month-summary";
import { TransactionDialog } from "./_components/transaction-dialog";
import type { TransactionRow } from "./_components/transaction-list";
import { TransactionsPanel } from "./_components/transactions-panel";

const TABS = [
  { value: "summary", label: "Resumo do mês" },
  { value: "transactions", label: "Lançamentos" },
  { value: "closures", label: "Fechamentos" },
  { value: "categories", label: "Categorias" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const isTabValue = (value: string): value is TabValue => TABS.some((tab) => tab.value === value);

export default function FinancePage() {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (!can("finance.access")) {
    return (
      <PageContainer>
        <EmptyState
          icon={Lock}
          title="Acesso restrito"
          description="Você não tem permissão para acessar as finanças. Fale com um administrador."
        />
      </PageContainer>
    );
  }

  return <FinanceDashboard />;
}

function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");
  const [monthRef, setMonthRef] = useState<MonthRef>(currentMonthRef);
  const [filters, setFilters] = useState<FinanceFiltersState>(emptyFinanceFilters);
  const [page, setPage] = useState(1);
  const transactionDialog = useEntityDialog<TransactionRow>();
  const utils = api.useUtils();

  const { data: categories = [] } = api.finance.listCategories.useQuery({ includeInactive: true });

  const handleTransactionSaved = async () => {
    transactionDialog.close();
    await utils.finance.invalidate();
  };

  const createTransactionMutation = api.finance.createTransaction.useMutation(
    mutationFeedback({
      success: "Lançamento registrado com sucesso",
      error: "Erro ao registrar lançamento",
      onSuccess: handleTransactionSaved,
    })
  );

  const updateTransactionMutation = api.finance.updateTransaction.useMutation(
    mutationFeedback({
      success: "Lançamento atualizado com sucesso",
      error: "Erro ao atualizar lançamento",
      onSuccess: handleTransactionSaved,
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

  const handleManageCategories = () => {
    transactionDialog.close();
    setActiveTab("categories");
  };

  return (
    <PageContainer>
      <TransactionDialog
        open={transactionDialog.open}
        onOpenChange={transactionDialog.onOpenChange}
        onSubmit={handleSubmitTransaction}
        onManageCategories={handleManageCategories}
        transaction={transactionDialog.editing}
        isLoading={createTransactionMutation.isPending || updateTransactionMutation.isPending}
        categories={categories}
      />

      <PageHeader
        title="Finanças"
        description="Entradas, saídas e fechamento do mês"
        className="print:hidden"
        actions={
          <Button onClick={transactionDialog.openCreate} className="w-full sm:w-auto">
            <Plus />
            Novo lançamento
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => isTabValue(value) && setActiveTab(value)}>
        <TabsList className="flex h-auto w-full snap-x justify-start gap-1 overflow-x-auto [scrollbar-width:none] print:hidden sm:w-auto sm:inline-flex [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="min-h-9 shrink-0 snap-start px-4 sm:min-h-7">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <MonthSummary monthRef={monthRef} onMonthChange={setMonthRef} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsPanel
            filters={filters}
            onFiltersChange={setFilters}
            page={page}
            onPageChange={setPage}
            categories={categories}
            onEdit={transactionDialog.openEdit}
          />
        </TabsContent>

        <TabsContent value="closures" className="mt-4">
          <ClosureList />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

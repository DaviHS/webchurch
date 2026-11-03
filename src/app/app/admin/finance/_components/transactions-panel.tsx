"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PaginationBar } from "@/components/pagination-bar";
import { useConfirm } from "@/components/confirm-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import { FinanceFilters, hasActiveFinanceFilters, type FinanceFiltersState, type FinancialCategory } from "./finance-filters";
import { TransactionList, type TransactionRow } from "./transaction-list";

const PAGE_SIZE = 30;

interface TransactionsPanelProps {
  filters: FinanceFiltersState;
  onFiltersChange: (filters: FinanceFiltersState) => void;
  page: number;
  onPageChange: (page: number) => void;
  categories: FinancialCategory[];
  onEdit: (transaction: TransactionRow) => void;
}

export function TransactionsPanel({ filters, onFiltersChange, page, onPageChange, categories, onEdit }: TransactionsPanelProps) {
  const confirm = useConfirm();
  const utils = api.useUtils();
  const search = useDebounce(filters.search.trim(), 300);

  const { data, isLoading, isFetching } = api.finance.listTransactions.useQuery(
    {
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.type,
      categoryId: filters.categoryId,
      search: search === "" ? undefined : search,
      page,
      limit: PAGE_SIZE,
    },
    { placeholderData: (previous) => previous }
  );

  const deleteTransactionMutation = api.finance.deleteTransaction.useMutation(
    mutationFeedback({
      success: "Lançamento excluído com sucesso",
      error: "Erro ao excluir lançamento",
      onSuccess: () => utils.finance.invalidate(),
    })
  );

  const handleFiltersChange = (next: FinanceFiltersState) => {
    onFiltersChange(next);
    onPageChange(1);
  };

  const handleDelete = async ({ transaction }: TransactionRow) => {
    const confirmed = await confirm({
      title: "Excluir lançamento?",
      description: `"${transaction.description}" será excluído. Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (confirmed) deleteTransactionMutation.mutate({ id: transaction.id });
  };

  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <FinanceFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            isSearching={isFetching && filters.search.trim() !== ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <TransactionList
            transactions={transactions}
            onEdit={onEdit}
            onDelete={(transaction) => void handleDelete(transaction)}
            isLoading={isLoading}
            hasFilters={hasActiveFinanceFilters(filters)}
          />
          <PaginationBar
            page={page}
            onPageChange={onPageChange}
            totalPages={data?.totalPages}
            total={data?.total}
            showing={transactions.length}
            itemLabel="lançamentos"
          />
        </CardContent>
      </Card>
    </div>
  );
}

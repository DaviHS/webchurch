"use client";

import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Printer,
  Receipt,
  RotateCcw,
  Scale,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorDisplay } from "@/components/ui/error-display";
import { StatCard } from "@/components/stat-card";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  TRANSACTION_TYPES,
  amountClassName,
  balanceClassName,
  compareMonths,
  currentMonthRef,
  formatCurrency,
  formatMonthYear,
  formatVariation,
  shiftMonth,
  type MonthRef,
  type TransactionType,
} from "./format";
import { MonthlyClosureDialog, type MonthSummary as MonthSummaryData } from "./monthly-closure-dialog";
import { useReopenMonth } from "./use-reopen-month";

interface MonthSummaryProps {
  monthRef: MonthRef;
  onMonthChange: (monthRef: MonthRef) => void;
}

const STAT_VALUE_CLASS = "text-lg sm:text-2xl";

export function MonthSummary({ monthRef, onMonthChange }: MonthSummaryProps) {
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const { handleReopen, isReopening } = useReopenMonth();
  const { data: summary, isLoading, error } = api.finance.getMonthSummary.useQuery(monthRef);

  const title = formatMonthYear(monthRef);
  const isCurrentOrLater = compareMonths(monthRef, currentMonthRef()) >= 0;
  const statusLabel = summary?.closure ? `Fechado em ${formatDate(summary.closure.closedAt)}` : "Em aberto";

  return (
    <div className="space-y-4">
      <div className="hidden space-y-1 print:block">
        <h2 className="text-xl font-bold">Relatório financeiro — {title}</h2>
        <p className="text-sm">Igreja Central</p>
        <p className="text-sm">{statusLabel}</p>
      </div>

      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(shiftMonth(monthRef, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft />
          </Button>
          <div className="min-w-0 flex-1 text-center sm:min-w-48">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            {summary && (
              <Badge variant={summary.closure ? "success" : "warning"} className="mt-1">
                {statusLabel}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(shiftMonth(monthRef, 1))}
            disabled={isCurrentOrLater}
            aria-label="Próximo mês"
          >
            <ChevronRight />
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {summary.canClose && (
              <Button onClick={() => setIsClosureDialogOpen(true)}>
                <Lock />
                Fechar mês
              </Button>
            )}
            {summary.canReopen && (
              <Button variant="outline" onClick={() => void handleReopen(monthRef)} disabled={isReopening}>
                <RotateCcw />
                Reabrir mês
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              Imprimir
            </Button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorDisplay title="Não foi possível carregar o resumo" message={error.message} />
      ) : isLoading || !summary ? (
        <LoadingState message="Carregando resumo..." />
      ) : (
        <SummaryContent summary={summary} />
      )}

      {summary && (
        <MonthlyClosureDialog open={isClosureDialogOpen} onOpenChange={setIsClosureDialogOpen} summary={summary} />
      )}
    </div>
  );
}

function SummaryContent({ summary }: { summary: MonthSummaryData }) {
  const previousMonth = shiftMonth(summary, -1).month;
  const hasClosingBalance = summary.closingBalance !== null;
  const finalValue = summary.closingBalance ?? summary.result;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="break-inside-avoid">
          <StatCard
            title="Saldo inicial"
            value={summary.openingBalance === null ? "—" : formatCurrency(summary.openingBalance)}
            description={summary.openingBalance === null ? "Defina no primeiro fechamento" : "Dinheiro em caixa no início"}
            icon={Wallet}
            valueClassName={STAT_VALUE_CLASS}
          />
        </div>
        <div className="break-inside-avoid">
          <StatCard
            title="Entradas"
            value={formatCurrency(summary.income)}
            description={formatVariation(summary.income, summary.previous.income, previousMonth, "Sem entradas")}
            icon={ArrowUpCircle}
            valueClassName={cn(STAT_VALUE_CLASS, "text-success")}
            iconClassName="text-success"
          />
        </div>
        <div className="break-inside-avoid">
          <StatCard
            title="Saídas"
            value={formatCurrency(summary.expense)}
            description={formatVariation(summary.expense, summary.previous.expense, previousMonth, "Sem saídas")}
            icon={ArrowDownCircle}
            valueClassName={cn(STAT_VALUE_CLASS, "text-destructive")}
            iconClassName="text-destructive"
          />
        </div>
        <div className="break-inside-avoid">
          <StatCard
            title={hasClosingBalance ? "Saldo final" : "Resultado do mês"}
            value={formatCurrency(finalValue)}
            description={hasClosingBalance ? "Saldo inicial + entradas − saídas" : "Entradas − saídas"}
            icon={Scale}
            valueClassName={cn(STAT_VALUE_CLASS, balanceClassName(finalValue))}
          />
        </div>
      </div>

      {summary.closure?.notes && (
        <Card className="break-inside-avoid">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">Observações do fechamento</p>
            <p className="whitespace-pre-line text-muted-foreground">{summary.closure.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="break-inside-avoid">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Por categoria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-4 pt-0 sm:p-6 sm:pt-0 md:grid-cols-2">
          <CategoryBreakdown type="income" summary={summary} />
          <CategoryBreakdown type="expense" summary={summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Lançamentos do mês</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {summary.transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="Nenhum lançamento neste mês" />
          ) : (
            <ul className="divide-y">
              {summary.transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-start justify-between gap-3 py-2 break-inside-avoid">
                  <div className="min-w-0 space-y-0.5">
                    <p className="break-words text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                      {transaction.categoryName && ` · ${transaction.categoryName}`}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-sm font-semibold tabular-nums", amountClassName(transaction.type))}>
                    {transaction.type === "expense" ? "− " : ""}
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CategoryBreakdown({ type, summary }: { type: TransactionType; summary: MonthSummaryData }) {
  const rows = summary.byCategory.filter((row) => row.type === type);
  const total = type === "income" ? summary.income : summary.expense;
  const label = TRANSACTION_TYPES[type].plural;

  return (
    <section className="space-y-3">
      <h3 className={cn("text-sm font-semibold", amountClassName(type))}>{label}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem {label.toLocaleLowerCase("pt-BR")} neste mês.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const share = total > 0 ? Math.round((row.total / total) * 100) : 0;
            return (
              <li key={`${row.type}-${row.categoryId}`} className="space-y-1 break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words font-medium">{row.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(row.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted [print-color-adjust:exact]">
                  <div
                    className={cn(
                      "h-full rounded-full [print-color-adjust:exact]",
                      type === "income" ? "bg-success" : "bg-destructive"
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {share}% · {row.count} {row.count === 1 ? "lançamento" : "lançamentos"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

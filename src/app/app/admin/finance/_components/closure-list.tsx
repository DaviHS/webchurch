"use client";

import { CalendarCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, fullName } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/types";
import { balanceClassName, formatCurrency, formatMonthYear } from "./format";
import { useReopenMonth } from "./use-reopen-month";

type ClosureRow = RouterOutputs["finance"]["listMonthlyClosures"][number];

function closedByText({ closure, closedBy }: ClosureRow): string {
  const name = fullName(closedBy, closedBy?.email ?? "");
  const date = formatDate(closure.closedAt);
  return name ? `Fechado por ${name} em ${date}` : `Fechado em ${date}`;
}

export function ClosureList() {
  const { data: closures = [], isLoading } = api.finance.listMonthlyClosures.useQuery();
  const { handleReopen, isReopening } = useReopenMonth();

  if (isLoading) return <LoadingState message="Carregando fechamentos..." />;

  if (closures.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Nenhum mês fechado ainda"
        description="Feche o mês na aba Resumo do mês para guardar o saldo."
      />
    );
  }

  const renderReopenButton = (row: ClosureRow) => (
    <Button
      variant="outline"
      onClick={() => void handleReopen({ month: row.closure.month, year: row.closure.year })}
      disabled={isReopening}
      className="w-full md:w-auto"
    >
      <RotateCcw />
      Reabrir
    </Button>
  );

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {closures.map((row, index) => {
          const { closure } = row;
          const closing = Number(closure.closingBalance);
          return (
            <li key={closure.id}>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{formatMonthYear(closure)}</h3>
                    <span className={cn("font-bold tabular-nums", balanceClassName(closing))}>
                      {formatCurrency(closing)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Saldo inicial</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(closure.openingBalance)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Entradas</dt>
                      <dd className="font-medium tabular-nums text-success">{formatCurrency(closure.totalIncome)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Saídas</dt>
                      <dd className="font-medium tabular-nums text-destructive">
                        {formatCurrency(closure.totalExpenses)}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">{closedByText(row)}</p>
                  {closure.notes && <p className="whitespace-pre-line text-sm">{closure.notes}</p>}
                  {index === 0 && renderReopenButton(row)}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Saldo inicial</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Saldo final</TableHead>
              <TableHead>Fechamento</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closures.map((row, index) => {
              const { closure } = row;
              const closing = Number(closure.closingBalance);
              return (
                <TableRow key={closure.id}>
                  <TableCell className="whitespace-nowrap font-medium">{formatMonthYear(closure)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(closure.openingBalance)}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">{formatCurrency(closure.totalIncome)}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">
                    {formatCurrency(closure.totalExpenses)}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold tabular-nums", balanceClassName(closing))}>
                    {formatCurrency(closing)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-muted-foreground">{closedByText(row)}</p>
                    {closure.notes && <p className="whitespace-pre-line break-words text-sm">{closure.notes}</p>}
                  </TableCell>
                  <TableCell className="text-right">{index === 0 && renderReopenButton(row)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

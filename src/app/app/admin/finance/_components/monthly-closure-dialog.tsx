"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, X } from "lucide-react";
import { monthlyClosureSchema, type MonthlyClosureFormData, type MonthlyClosureFormInput } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/types";
import { balanceClassName, formatCurrency, formatMonthYear, normalizeMoneyInput, toCents } from "./format";

export type MonthSummary = RouterOutputs["finance"]["getMonthSummary"];

interface MonthlyClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: MonthSummary;
}

export function MonthlyClosureDialog({ open, onOpenChange, summary }: MonthlyClosureDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Fechar {formatMonthYear(summary).toLocaleLowerCase("pt-BR")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Depois de fechado, os lançamentos deste mês não podem ser alterados.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <MonthlyClosureForm
          key={`${summary.year}-${summary.month}`}
          summary={summary}
          onDone={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function SummaryLine({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", className)}>{value}</span>
    </div>
  );
}

function MonthlyClosureForm({ summary, onDone }: { summary: MonthSummary; onDone: () => void }) {
  const utils = api.useUtils();
  const needsOpeningBalance = !summary.hasPreviousClosure;

  const form = useForm<MonthlyClosureFormInput, unknown, MonthlyClosureFormData>({
    resolver: zodResolver(monthlyClosureSchema),
    defaultValues: {
      month: summary.month,
      year: summary.year,
      openingBalance: needsOpeningBalance ? "" : undefined,
      notes: "",
    },
  });

  const typedOpeningBalance = useWatch({ control: form.control, name: "openingBalance" });

  const closeMonthMutation = api.finance.closeMonth.useMutation(
    mutationFeedback({
      loading: "Fechando o mês...",
      success: "Mês fechado com sucesso",
      error: "Erro ao fechar mês",
      onSuccess: async () => {
        onDone();
        await utils.finance.invalidate();
      },
    })
  );

  const openingCents = needsOpeningBalance ? toCents(typedOpeningBalance) : toCents(summary.openingBalance);
  const closingCents = openingCents + toCents(summary.income) - toCents(summary.expense);

  const handleSubmit = (data: MonthlyClosureFormData) => {
    closeMonthMutation.mutate({
      month: data.month,
      year: data.year,
      openingBalance: needsOpeningBalance ? data.openingBalance : undefined,
      notes: data.notes === "" ? undefined : data.notes,
    });
  };

  const isSaving = closeMonthMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <ResponsiveDialogBody className="space-y-4">
          {needsOpeningBalance ? (
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo inicial (dinheiro em caixa no início do mês) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0,00"
                      onChange={(event) => field.onChange(normalizeMoneyInput(event.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Este é o primeiro fechamento. Os próximos usam o saldo final do mês anterior.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <div className="divide-y rounded-lg border px-4">
            {!needsOpeningBalance && (
              <SummaryLine label="Saldo inicial" value={formatCurrency(summary.openingBalance)} />
            )}
            <SummaryLine label="Entradas" value={formatCurrency(summary.income)} className="text-success" />
            <SummaryLine label="Saídas" value={formatCurrency(summary.expense)} className="text-destructive" />
            <SummaryLine
              label="Saldo final"
              value={formatCurrency(closingCents / 100)}
              className={balanceClassName(closingCents)}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} className="resize-none" placeholder="Opcional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isSaving}>
            <X />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Lock />}
            {isSaving ? "Fechando..." : "Fechar mês"}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </Form>
  );
}

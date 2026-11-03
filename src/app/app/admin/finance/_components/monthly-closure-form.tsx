"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monthlyClosureSchema, type MonthlyClosureFormData } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calculator, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { balanceClassName, formatCurrency } from "./format";

interface MonthlyClosureFormProps {
  onSubmit: (data: MonthlyClosureFormData) => void;
  isLoading?: boolean;
  currentMonth: number;
  currentYear: number;
  onCancel?: () => void;
}

export function MonthlyClosureForm({ onSubmit, isLoading = false, currentMonth, currentYear, onCancel }: MonthlyClosureFormProps) {
  const form = useForm<MonthlyClosureFormData>({
    resolver: zodResolver(monthlyClosureSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
      openingBalance: "",
      notes: "",
    }
  });

  const selectedMonth = useWatch({ control: form.control, name: 'month' });
  const selectedYear = useWatch({ control: form.control, name: 'year' });

  const { data: monthlyReport, isLoading: isLoadingReport } = api.finance.getMonthlyReport.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const totalIncome = monthlyReport?.summary.find((s) => s.type === 'income')?.total ?? '0';
  const totalExpenses = monthlyReport?.summary.find((s) => s.type === 'expense')?.total ?? '0';
  const income = Number(totalIncome);
  const expenses = Number(totalExpenses);
  const netBalance = income - expenses;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isLoadingReport && <Skeleton className="h-28 w-full rounded-xl" />}

        {!isLoadingReport && monthlyReport && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de receitas:</span>
                  <span className="font-medium text-success">{formatCurrency(income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de despesas:</span>
                  <span className="font-medium text-destructive">{formatCurrency(expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Resultado líquido:</span>
                  <span className={`font-bold ${balanceClassName(netBalance)}`}>
                    {formatCurrency(netBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo inicial *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  step="0.01" 
                  placeholder="0,00" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={3} 
                  className="resize-none" 
                  placeholder="Observações sobre o fechamento..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Esta ação não pode ser desfeita. Certifique-se de que todos os lançamentos do mês estão corretos.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isLoadingReport}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            {isLoading ? "Processando..." : "Confirmar fechamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monthlyClosureSchema, type MonthlyClosureFormData } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calculator } from "lucide-react";
import { api } from "@/trpc/react";
import { useEffect } from "react";

interface MonthlyClosureFormProps {
  onSubmit: (data: MonthlyClosureFormData) => void;
  isLoading?: boolean;
  currentMonth: number;
  currentYear: number;
}

export function MonthlyClosureForm({ onSubmit, isLoading, currentMonth, currentYear }: MonthlyClosureFormProps) {
  const form = useForm<MonthlyClosureFormData>({
    resolver: zodResolver(monthlyClosureSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
      openingBalance: "",
      notes: "",
    }
  });

  const selectedMonth = form.watch('month');
  const selectedYear = form.watch('year');

  // Fetch monthly report when month/year changes
  const { data: monthlyReport, isLoading: isLoadingReport } = api.finance.getMonthlyReport.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!selectedMonth && !!selectedYear }
  );

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

  const currentYearOption = currentYear;
  const yearOptions = [currentYearOption - 1, currentYearOption, currentYearOption + 1];

  const totalIncome = monthlyReport?.summary?.find(s => s.type === 'income')?.total || '0';
  const totalExpenses = monthlyReport?.summary?.find(s => s.type === 'expense')?.total || '0';
  const netBalance = parseFloat(totalIncome) - parseFloat(totalExpenses);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Mês */}
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
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

          {/* Ano */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
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

        {/* Monthly Summary */}
        {!isLoadingReport && monthlyReport && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Receitas:</span>
                  <span className="text-green-600 font-medium">
                    R$ {parseFloat(totalIncome).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Despesas:</span>
                  <span className="text-red-600 font-medium">
                    R$ {parseFloat(totalExpenses).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Resultado Líquido:</span>
                  <span className={`font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {netBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saldo Inicial */}
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial *</FormLabel>
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

        {/* Notas */}
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

        {/* Warning Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Esta ação não pode ser desfeita. Certifique-se de que todos os lançamentos do mês estão corretos.
          </AlertDescription>
        </Alert>

        <Button 
          type="submit" 
          disabled={isLoading || isLoadingReport} 
          className="w-full"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isLoading ? "Processando..." : "Confirmar Fechamento"}
        </Button>
      </form>
    </Form>
  );
}
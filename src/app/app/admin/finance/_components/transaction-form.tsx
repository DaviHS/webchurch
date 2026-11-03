"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { financialTransactionSchema, type FinancialTransactionFormData, type FinancialTransactionFormInput } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transactions-list";

const { shape } = financialTransactionSchema;

export function transactionToFormValues({ transaction }: TransactionRow): Partial<FinancialTransactionFormInput> {
  const type = shape.type.safeParse(transaction.type);
  const paymentMethod = shape.paymentMethod.safeParse(transaction.paymentMethod);
  const recurrencePattern = shape.recurrencePattern.safeParse(transaction.recurrencePattern);

  return {
    categoryId: transaction.categoryId,
    type: type.success ? type.data : undefined,
    amount: transaction.amount,
    description: transaction.description,
    transactionDate: transaction.transactionDate,
    paymentMethod: paymentMethod.success ? paymentMethod.data : undefined,
    referenceNumber: transaction.referenceNumber ?? undefined,
    memberId: transaction.memberId ?? undefined,
    isRecurring: transaction.isRecurring ?? undefined,
    recurrencePattern: recurrencePattern.success ? recurrencePattern.data : undefined,
    notes: transaction.notes ?? undefined,
  };
}

interface TransactionFormProps {
  onSubmit: (data: FinancialTransactionFormData) => void;
  initialData?: Partial<FinancialTransactionFormInput>;
  isLoading?: boolean;
  categories: FinancialCategory[];
  onCancel?: () => void;
}

export function TransactionForm({ onSubmit, initialData, isLoading = false, categories, onCancel }: TransactionFormProps) {
  const form = useForm<FinancialTransactionFormInput, unknown, FinancialTransactionFormData>({
    resolver: zodResolver(financialTransactionSchema),
    defaultValues: {
      categoryId: initialData?.categoryId,
      type: initialData?.type ?? "income",
      amount: initialData?.amount ?? "",
      description: initialData?.description ?? "",
      transactionDate: initialData?.transactionDate ?? new Date(),
      paymentMethod: initialData?.paymentMethod ?? "cash",
      referenceNumber: initialData?.referenceNumber ?? "",
      memberId: initialData?.memberId,
      isRecurring: initialData?.isRecurring ?? false,
      recurrencePattern: initialData?.recurrencePattern ?? "monthly",
      notes: initialData?.notes ?? "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const isRecurring = useWatch({ control: form.control, name: "isRecurring" });

  const categoryTypeFor = (type: FinancialTransactionFormInput["type"]) => (type === "income" ? "income" : "expense");
  const visibleCategories = categories.filter((cat) => cat.type === categoryTypeFor(selectedType));

  const handleTypeChange = (type: FinancialTransactionFormInput["type"]) => {
    form.setValue("type", type, { shouldDirty: true });
    const currentCategory = categories.find((cat) => cat.id === form.getValues("categoryId"));
    if (currentCategory && currentCategory.type !== categoryTypeFor(type)) {
      form.setValue("categoryId", 0, { shouldDirty: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const parsed = shape.type.safeParse(value);
                    if (parsed.success) handleTypeChange(parsed.data);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value ? String(field.value) : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {visibleCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0,00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de referência</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Descrição da transação" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Transação recorrente</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isRecurring && (
          <FormField
            control={form.control}
            name="recurrencePattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recorrência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a recorrência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} className="resize-none" placeholder="Observações adicionais..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
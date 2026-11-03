"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { financialTransactionSchema, type FinancialTransactionFormData, type FinancialTransactionFormInput } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/ui/responsive-dialog";
import { Loader2, Save, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transaction-list";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPES, normalizeMoneyInput } from "./format";

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
  const visibleCategories = categories.filter((category) => category.type === categoryTypeFor(selectedType));

  const handleTypeChange = (type: FinancialTransactionFormInput["type"]) => {
    form.setValue("type", type, { shouldDirty: true });
    const currentCategory = categories.find((category) => category.id === form.getValues("categoryId"));
    if (currentCategory && currentCategory.type !== categoryTypeFor(type)) {
      form.setValue("categoryId", 0, { shouldDirty: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <ResponsiveDialogBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      {Object.entries(TRANSACTION_TYPES).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
                      {visibleCategories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
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
                    <Input
                      {...field}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0,00"
                      onChange={(event) => field.onChange(normalizeMoneyInput(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
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
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              <FormItem className="flex min-h-10 flex-row items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Transação recorrente</FormLabel>
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
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X />
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar transação"}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </Form>
  );
}

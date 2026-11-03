"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Tags, X } from "lucide-react";
import {
  financialTransactionSchema,
  type FinancialTransactionFormData,
  type FinancialTransactionFormInput,
} from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/ui/responsive-dialog";
import { cleanEmptyStrings } from "@/lib/formatters";
import type { FinancialCategory } from "./finance-filters";
import type { TransactionRow } from "./transaction-list";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPES, normalizeMoneyInput, type TransactionType } from "./format";
import { TransactionTypeToggle } from "./transaction-type-toggle";

const { shape } = financialTransactionSchema;
const NO_PAYMENT_METHOD = "none";

export function transactionToFormValues({ transaction }: TransactionRow): Partial<FinancialTransactionFormInput> {
  const type = shape.type.safeParse(transaction.type);
  const paymentMethod = shape.paymentMethod.safeParse(transaction.paymentMethod ?? undefined);

  return {
    categoryId: transaction.categoryId,
    type: type.success ? type.data : undefined,
    amount: transaction.amount,
    description: transaction.description,
    transactionDate: transaction.transactionDate,
    paymentMethod: paymentMethod.success ? paymentMethod.data : undefined,
    referenceNumber: transaction.referenceNumber ?? "",
    notes: transaction.notes ?? "",
  };
}

interface TransactionFormProps {
  onSubmit: (data: FinancialTransactionFormData) => void;
  initialData?: Partial<FinancialTransactionFormInput>;
  isLoading?: boolean;
  categories: FinancialCategory[];
  onCancel: () => void;
  onManageCategories: () => void;
}

export function TransactionForm({
  onSubmit,
  initialData,
  isLoading = false,
  categories,
  onCancel,
  onManageCategories,
}: TransactionFormProps) {
  const form = useForm<FinancialTransactionFormInput, unknown, FinancialTransactionFormData>({
    resolver: zodResolver(financialTransactionSchema),
    defaultValues: {
      categoryId: initialData?.categoryId ?? 0,
      type: initialData?.type ?? "income",
      amount: initialData?.amount ?? "",
      description: initialData?.description ?? "",
      transactionDate: initialData?.transactionDate ?? new Date(),
      paymentMethod: initialData?.paymentMethod,
      referenceNumber: initialData?.referenceNumber ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const visibleCategories = categories.filter(
    (category) => category.type === selectedType && (category.isActive || category.id === initialData?.categoryId)
  );

  const handleTypeChange = (type: TransactionType) => {
    if (type === form.getValues("type")) return;
    form.setValue("type", type, { shouldDirty: true });
    form.setValue("categoryId", 0, { shouldDirty: true });
  };

  const handleSubmit = (data: FinancialTransactionFormData) => onSubmit(cleanEmptyStrings(data));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <ResponsiveDialogBody className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <TransactionTypeToggle value={field.value} onChange={handleTypeChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <DatePicker
                    date={field.value}
                    setDate={(date) => {
                      if (date) field.onChange(date);
                    }}
                  />
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
                  <Input {...field} placeholder={selectedType === "income" ? "Ex.: Dízimos do culto de domingo" : "Ex.: Conta de luz"} />
                </FormControl>
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
                {visibleCategories.length === 0 ? (
                  <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                    <p>
                      Nenhuma categoria de {TRANSACTION_TYPES[selectedType].label.toLocaleLowerCase("pt-BR")} ativa. Crie uma
                      categoria antes de lançar.
                    </p>
                    <Button type="button" variant="outline" onClick={onManageCategories} className="w-full sm:w-auto">
                      <Tags />
                      Ir para categorias
                    </Button>
                  </div>
                ) : (
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
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const parsed = shape.paymentMethod.safeParse(value === NO_PAYMENT_METHOD ? undefined : value);
                      field.onChange(parsed.success ? parsed.data : undefined);
                    }}
                    value={field.value ?? NO_PAYMENT_METHOD}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Não informada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PAYMENT_METHOD}>Não informada</SelectItem>
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
                  <FormLabel>Nº de referência</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Opcional" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} rows={3} className="resize-none" placeholder="Opcional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Registrar lançamento"}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </Form>
  );
}

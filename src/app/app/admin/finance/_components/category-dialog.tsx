"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, X } from "lucide-react";
import { financialCategorySchema, type FinancialCategoryFormData } from "@/validators/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { FinancialCategory } from "./finance-filters";
import { TRANSACTION_TYPES } from "./format";
import { TransactionTypeToggle } from "./transaction-type-toggle";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinancialCategory | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{category ? "Renomear categoria" : "Nova categoria"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <CategoryForm key={category?.id ?? "new"} category={category} onDone={() => onOpenChange(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function CategoryForm({ category, onDone }: { category: FinancialCategory | null; onDone: () => void }) {
  const utils = api.useUtils();
  const categoryType = category && (category.type === "income" || category.type === "expense") ? category.type : "income";

  const form = useForm<FinancialCategoryFormData>({
    resolver: zodResolver(financialCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: categoryType,
      description: category?.description ?? "",
    },
  });

  const handleSaved = async () => {
    onDone();
    await utils.finance.invalidate();
  };

  const createCategoryMutation = api.finance.createCategory.useMutation(
    mutationFeedback({ success: "Categoria criada com sucesso", error: "Erro ao criar categoria", onSuccess: handleSaved })
  );

  const updateCategoryMutation = api.finance.updateCategory.useMutation(
    mutationFeedback({
      success: "Categoria atualizada com sucesso",
      error: "Erro ao atualizar categoria",
      onSuccess: handleSaved,
    })
  );

  const handleSubmit = (data: FinancialCategoryFormData) => {
    const description = data.description === "" ? undefined : data.description;
    if (category) {
      updateCategoryMutation.mutate({ id: category.id, name: data.name, description });
    } else {
      createCategoryMutation.mutate({ ...data, description });
    }
  };

  const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <ResponsiveDialogBody className="space-y-4">
          {category ? (
            <p className="text-sm text-muted-foreground">Categoria de {TRANSACTION_TYPES[categoryType].label.toLocaleLowerCase("pt-BR")}</p>
          ) : (
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <TransactionTypeToggle value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex.: Dízimos" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} rows={2} className="resize-none" placeholder="Opcional" />
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
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </Form>
  );
}

"use client";

import { Ban, Pencil, Plus, RotateCcw, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { CategoryDialog } from "./category-dialog";
import type { FinancialCategory } from "./finance-filters";
import { TRANSACTION_TYPES, amountClassName, type TransactionType } from "./format";

const GROUPS: TransactionType[] = ["income", "expense"];

export function CategoryManager() {
  const utils = api.useUtils();
  const categoryDialog = useEntityDialog<FinancialCategory>();
  const { data: categories = [], isLoading } = api.finance.listCategories.useQuery({ includeInactive: true });

  const setCategoryActiveMutation = api.finance.setCategoryActive.useMutation(
    mutationFeedback({
      success: (category) => (category.isActive ? "Categoria reativada com sucesso" : "Categoria desativada com sucesso"),
      error: "Erro ao alterar categoria",
      onSuccess: () => utils.finance.invalidate(),
    })
  );

  const createDefaultCategoriesMutation = api.finance.createDefaultCategories.useMutation(
    mutationFeedback({
      success: "Categorias padrão criadas com sucesso",
      error: "Erro ao criar categorias padrão",
      onSuccess: () => utils.finance.invalidate(),
    })
  );

  const dialog = (
    <CategoryDialog
      open={categoryDialog.open}
      onOpenChange={categoryDialog.onOpenChange}
      category={categoryDialog.editing}
    />
  );

  if (isLoading) return <LoadingState message="Carregando categorias..." />;

  if (categories.length === 0) {
    return (
      <>
        {dialog}
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria cadastrada"
          description="As categorias organizam as entradas e saídas (ex.: Dízimos, Ofertas, Aluguel)."
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => createDefaultCategoriesMutation.mutate()}
                disabled={createDefaultCategoriesMutation.isPending}
              >
                <Tags />
                Criar categorias padrão
              </Button>
              <Button variant="outline" onClick={categoryDialog.openCreate}>
                <Plus />
                Nova categoria
              </Button>
            </div>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {dialog}
      <div className="flex justify-end">
        <Button onClick={categoryDialog.openCreate} className="w-full sm:w-auto">
          <Plus />
          Nova categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((type) => {
          const items = categories.filter((category) => category.type === type);
          return (
            <Card key={type}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className={cn("text-base", amountClassName(type))}>{TRANSACTION_TYPES[type].plural}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
                ) : (
                  <ul className="divide-y">
                    {items.map((category) => (
                      <li key={category.id} className="flex items-center justify-between gap-3 py-2">
                        <div className={cn("min-w-0 space-y-0.5", !category.isActive && "text-muted-foreground")}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-medium">{category.name}</span>
                            {!category.isActive && <Badge variant="muted">Inativa</Badge>}
                          </div>
                          {category.description && (
                            <p className="break-words text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <RowActionsMenu
                          label={`Ações da categoria ${category.name}`}
                          actions={[
                            { label: "Renomear", icon: Pencil, onSelect: () => categoryDialog.openEdit(category) },
                            {
                              label: category.isActive ? "Desativar" : "Reativar",
                              icon: category.isActive ? Ban : RotateCcw,
                              destructive: category.isActive,
                              disabled: setCategoryActiveMutation.isPending,
                              onSelect: () =>
                                setCategoryActiveMutation.mutate({ id: category.id, isActive: !category.isActive }),
                            },
                          ]}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

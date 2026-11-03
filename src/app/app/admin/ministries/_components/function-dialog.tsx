"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { functionSchema, type FunctionFormData, type FunctionFormInput } from "@/validators/ministry";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { mutationFeedback } from "@/lib/mutation-feedback";
import type { RouterOutputs } from "@/types";
import { FormDialogFooterActions } from "./form-dialog-footer-actions";

export type MinistryFunction = RouterOutputs["ministry"]["listFunctions"][number];

interface FunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  functionItem: MinistryFunction | null;
}

export function FunctionDialog({ open, onOpenChange, functionItem }: FunctionDialogProps) {
  const isEditing = functionItem !== null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditing ? "Editar função" : "Nova função"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditing ? "Atualize os dados da função" : "Adicione uma nova função para os ministérios"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <FunctionForm key={functionItem?.id ?? "new"} functionItem={functionItem} onDone={() => onOpenChange(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface FunctionFormProps {
  functionItem: MinistryFunction | null;
  onDone: () => void;
}

function FunctionForm({ functionItem, onDone }: FunctionFormProps) {
  const utils = api.useUtils();
  const form = useForm<FunctionFormInput, unknown, FunctionFormData>({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      name: functionItem?.name ?? "",
      description: functionItem?.description ?? "",
      displayOrder: functionItem?.displayOrder ?? 0,
    },
  });

  const handleSaved = async () => {
    onDone();
    await Promise.all([
      utils.ministry.listFunctions.invalidate(),
      utils.ministry.getMinistryFunctions.invalidate(),
      utils.ministry.getAvailableFunctions.invalidate(),
    ]);
  };

  const createFunctionMutation = api.ministry.createFunction.useMutation(
    mutationFeedback({
      success: "Função criada com sucesso",
      error: "Erro ao criar função",
      onSuccess: handleSaved,
    })
  );

  const updateFunctionMutation = api.ministry.updateFunction.useMutation(
    mutationFeedback({
      success: "Função atualizada com sucesso",
      error: "Erro ao atualizar função",
      onSuccess: handleSaved,
    })
  );

  const handleSubmit = (data: FunctionFormData) => {
    if (functionItem) {
      updateFunctionMutation.mutate({ id: functionItem.id, ...data });
    } else {
      createFunctionMutation.mutate(data);
    }
  };

  const isPending = createFunctionMutation.isPending || updateFunctionMutation.isPending;
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="function-name">Nome da função *</Label>
          <Input
            id="function-name"
            {...form.register("name")}
            placeholder="Ex: Líder, Vocalista, Guitarrista..."
            disabled={isPending}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="function-description">Descrição</Label>
          <Textarea
            id="function-description"
            {...form.register("description")}
            placeholder="Descreva as responsabilidades desta função..."
            rows={3}
            disabled={isPending}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="function-display-order">Ordem de exibição</Label>
          <Input
            id="function-display-order"
            type="number"
            inputMode="numeric"
            {...form.register("displayOrder", { valueAsNumber: true })}
            placeholder="0"
            disabled={isPending}
          />
          {errors.displayOrder && <p className="text-sm text-destructive">{errors.displayOrder.message}</p>}
        </div>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        <FormDialogFooterActions
          isPending={isPending}
          submitLabel={functionItem ? "Salvar" : "Criar função"}
          onCancel={onDone}
        />
      </ResponsiveDialogFooter>
    </form>
  );
}

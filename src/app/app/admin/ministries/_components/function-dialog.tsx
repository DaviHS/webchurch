"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { functionSchema, type FunctionFormData, type FunctionFormInput } from "@/validators/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/types";

export type MinistryFunction = RouterOutputs["ministry"]["getAllFunctions"][number];

interface FunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  functionItem: MinistryFunction | null;
}

export function FunctionDialog({ open, onOpenChange, functionItem }: FunctionDialogProps) {
  const isEdit = functionItem !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar função" : "Nova função"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da função" : "Adicione uma nova função para os ministérios"}
          </DialogDescription>
        </DialogHeader>

        <FunctionForm
          key={functionItem?.id ?? "new"}
          functionItem={functionItem}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface FunctionFormProps {
  functionItem: MinistryFunction | null;
  onDone: () => void;
}

function FunctionForm({ functionItem, onDone }: FunctionFormProps) {
  const form = useForm<FunctionFormInput, unknown, FunctionFormData>({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      name: functionItem?.name ?? "",
      description: functionItem?.description ?? "",
      displayOrder: functionItem?.displayOrder ?? 0,
    },
  });

  const createFunction = api.ministry.createFunction.useMutation({
    onSuccess: () => {
      toast.success("Função criada com sucesso");
      onDone();
    },
    onError: (error) => {
      toast.error(`Erro ao criar função: ${error.message}`);
    },
  });

  const updateFunction = api.ministry.updateFunction.useMutation({
    onSuccess: () => {
      toast.success("Função atualizada com sucesso");
      onDone();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar função: ${error.message}`);
    },
  });

  const onSubmit = (data: FunctionFormData) => {
    if (functionItem) {
      updateFunction.mutate({ id: functionItem.id, ...data });
    } else {
      createFunction.mutate(data);
    }
  };

  const isLoading = createFunction.isPending || updateFunction.isPending;
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="function-name">Nome da função *</Label>
        <Input
          id="function-name"
          {...form.register("name")}
          placeholder="Ex: Líder, Vocalista, Guitarrista..."
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-description">Descrição</Label>
        <Textarea
          id="function-description"
          {...form.register("description")}
          placeholder="Descreva as responsabilidades desta função..."
          rows={3}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-display-order">Ordem de exibição</Label>
        <Input
          id="function-display-order"
          type="number"
          {...form.register("displayOrder", { valueAsNumber: true })}
          placeholder="0"
          disabled={isLoading}
        />
        {errors.displayOrder && (
          <p className="text-sm text-destructive">{errors.displayOrder.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {functionItem ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

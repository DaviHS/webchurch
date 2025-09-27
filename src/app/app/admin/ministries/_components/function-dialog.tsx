// app/app/admin/ministries/_components/function-dialog.tsx - CORRIGIDO
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { functionSchema, type FunctionFormData } from "@/validators/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect } from "react";

interface FunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  functionItem?: any;
}

export function FunctionDialog({ open, onOpenChange, functionItem }: FunctionDialogProps) {
  const isEdit = !!functionItem;

  const form = useForm<FunctionFormData>({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
    },
  });

  const createFunction = api.ministry.createFunction.useMutation({
    onSuccess: () => {
      toast.success("Função criada com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateFunction = api.ministry.updateFunction.useMutation({
    onSuccess: () => {
      toast.success("Função atualizada com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // CORREÇÃO: Reset do form quando abrir/fechar
  useEffect(() => {
    if (open) {
      if (functionItem) {
        form.reset({
          name: functionItem.name || "",
          description: functionItem.description || "",
          displayOrder: functionItem.displayOrder || 0,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          displayOrder: 0,
        });
      }
    }
  }, [open, functionItem, form]);

  const onSubmit = (data: FunctionFormData) => {
    // CORREÇÃO: Validar dados antes de enviar
    const validatedData = functionSchema.parse(data);
    
    if (isEdit) {
      updateFunction.mutate({ 
        id: functionItem.id, 
        ...validatedData 
      });
    } else {
      createFunction.mutate(validatedData);
    }
  };

  const isLoading = createFunction.isPending || updateFunction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Função" : "Criar Função"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da função" : "Adicione uma nova função para os ministérios"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Função *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex: Líder, Vocalista, Guitarrista..."
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descreva as responsabilidades desta função..."
              rows={3}
              disabled={isLoading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Ordem de Exibição</Label>
            <Input
              id="displayOrder"
              type="number"
              {...form.register("displayOrder", { valueAsNumber: true })}
              placeholder="0"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
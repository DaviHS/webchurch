// app/app/admin/ministries/_components/function-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { functionSchema, type FunctionFormData } from "@/validators/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2, Briefcase } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface FunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  functionItem?: any;
}

export function FunctionDialog({ open, onOpenChange, functionItem }: FunctionDialogProps) {
  const isEdit = !!functionItem;
  const [functions, setFunctions] = useState<any[]>([]);

  const { data: existingFunctions = [], refetch } = api.ministry.getAllFunctions.useQuery(undefined, {
    enabled: open,
  });

  const createFunction = api.ministry.createFunction.useMutation({
    onSuccess: () => {
      toast.success("Função criada com sucesso!");
      refetch();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateFunction = api.ministry.updateFunction.useMutation({
    onSuccess: () => {
      toast.success("Função atualizada com sucesso!");
      refetch();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteFunction = api.ministry.deleteFunction.useMutation({
    onSuccess: () => {
      toast.success("Função excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<FunctionFormData>({
    resolver: zodResolver(functionSchema),
    defaultValues: functionItem || {
      name: "",
      description: "",
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (functionItem && open) {
      form.reset(functionItem);
    } else if (open) {
      form.reset({
        name: "",
        description: "",
        displayOrder: 0,
      });
    }
    setFunctions(existingFunctions);
  }, [functionItem, open, form, existingFunctions]);

  const onSubmit = (data: FunctionFormData) => {
    if (isEdit) {
      updateFunction.mutate({ id: functionItem.id, ...data });
    } else {
      createFunction.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta função?")) {
      deleteFunction.mutate({ id });
    }
  };

  const isLoading = createFunction.isPending || updateFunction.isPending || deleteFunction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {isEdit ? "Editar Função" : "Gerenciar Funções"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da função" : "Crie novas funções para os ministérios"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          {/* Formulário de criação/edição */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Função *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ex: Vocalista, Guitarrista, Professor..."
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...form.register("displayOrder", { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Define a ordem em que as funções aparecem nas listas (menor número primeiro)
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(functionItem.id)}
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
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
          </div>

          {/* Lista de funções existentes */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Funções Existentes</h3>
            {functions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma função cadastrada
              </p>
            ) : (
              <div className="space-y-2">
                {functions.map((func) => (
                  <div
                    key={func.id}
                    className={`p-3 rounded border text-sm ${
                      functionItem?.id === func.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{func.name}</div>
                        {func.description && (
                          <div className="text-muted-foreground mt-1">
                            {func.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Ordem: {func.displayOrder || 0}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.reset(func);
                        }}
                        disabled={isEdit && functionItem?.id === func.id}
                      >
                        <Briefcase className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
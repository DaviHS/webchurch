// app/app/admin/ministries/_components/ministry-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ministrySchema, type MinistryFormData } from "@/validators/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2, Users } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface MinistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry?: any;
}

export function MinistryDialog({ open, onOpenChange, ministry }: MinistryDialogProps) {
  const isEdit = !!ministry;
  const [ministries, setMinistries] = useState<any[]>([]);

  const { data: existingMinistries = [], refetch } = api.ministry.getAll.useQuery(undefined, {
    enabled: open,
  });

  const createMinistry = api.ministry.create.useMutation({
    onSuccess: () => {
      toast.success("Ministério criado com sucesso!");
      refetch();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMinistry = api.ministry.update.useMutation({
    onSuccess: () => {
      toast.success("Ministério atualizado com sucesso!");
      refetch();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMinistry = api.ministry.delete.useMutation({
    onSuccess: () => {
      toast.success("Ministério excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    defaultValues: ministry || {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (ministry && open) {
      form.reset(ministry);
    } else if (open) {
      form.reset({
        name: "",
        description: "",
      });
    }
    setMinistries(existingMinistries);
  }, [ministry, open, form, existingMinistries]);

  const onSubmit = (data: MinistryFormData) => {
    if (isEdit) {
      updateMinistry.mutate({ id: ministry.id, ...data });
    } else {
      createMinistry.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este ministério?")) {
      deleteMinistry.mutate({ id });
    }
  };

  const isLoading = createMinistry.isPending || updateMinistry.isPending || deleteMinistry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEdit ? "Editar Ministério" : "Gerenciar Ministérios"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do ministério" : "Crie novos ministérios para a igreja"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          {/* Formulário de criação/edição */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Ministério *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ex: Louvor, Diaconia, Educação..."
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
                  placeholder="Descreva as atividades deste ministério..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(ministry.id)}
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

          {/* Lista de ministérios existentes */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Ministérios Existentes</h3>
            {ministries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ministério cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {ministries.map((min) => (
                  <div
                    key={min.id}
                    className={`p-3 rounded border text-sm ${
                      ministry?.id === min.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{min.name}</div>
                        {min.description && (
                          <div className="text-muted-foreground mt-1 line-clamp-2">
                            {min.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.reset(min);
                        }}
                        disabled={isEdit && ministry?.id === min.id}
                      >
                        <Users className="h-3 w-3" />
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
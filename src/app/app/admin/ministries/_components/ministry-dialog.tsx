// app/app/admin/ministries/_components/ministry-dialog.tsx - CORRIGIDO
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ministrySchema, type MinistryFormData } from "@/validators/ministry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect } from "react";

interface MinistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry?: any;
}

export function MinistryDialog({ open, onOpenChange, ministry }: MinistryDialogProps) {
  const isEdit = !!ministry;

  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMinistry = api.ministry.create.useMutation({
    onSuccess: () => {
      toast.success("Ministério criado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMinistry = api.ministry.update.useMutation({
    onSuccess: () => {
      toast.success("Ministério atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // CORREÇÃO: Reset do form quando abrir/fechar
  useEffect(() => {
    if (open) {
      if (ministry) {
        form.reset({
          name: ministry.name || "",
          description: ministry.description || "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
        });
      }
    }
  }, [open, ministry, form]);

  const onSubmit = (data: MinistryFormData) => {
    // CORREÇÃO: Validar dados antes de enviar
    const validatedData = ministrySchema.parse(data);
    
    if (isEdit) {
      updateMinistry.mutate({ 
        id: ministry.id, 
        ...validatedData 
      });
    } else {
      createMinistry.mutate(validatedData);
    }
  };

  const isLoading = createMinistry.isPending || updateMinistry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Ministério" : "Criar Ministério"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do ministério" : "Adicione um novo ministério à igreja"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ministério *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex: Louvor, Diaconia, Educação..."
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
              placeholder="Descreva as atividades deste ministério..."
              rows={3}
              disabled={isLoading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
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
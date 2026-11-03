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
import type { RouterOutputs } from "@/types";

export type Ministry = RouterOutputs["ministry"]["getAll"][number];

interface MinistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry | null;
}

export function MinistryDialog({ open, onOpenChange, ministry }: MinistryDialogProps) {
  const isEdit = ministry !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar ministério" : "Novo ministério"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do ministério" : "Adicione um novo ministério à igreja"}
          </DialogDescription>
        </DialogHeader>

        <MinistryForm
          key={ministry?.id ?? "new"}
          ministry={ministry}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface MinistryFormProps {
  ministry: Ministry | null;
  onDone: () => void;
}

function MinistryForm({ ministry, onDone }: MinistryFormProps) {
  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: ministry?.name ?? "",
      description: ministry?.description ?? "",
    },
  });

  const createMinistry = api.ministry.create.useMutation({
    onSuccess: () => {
      toast.success("Ministério criado com sucesso");
      onDone();
    },
    onError: (error) => {
      toast.error(`Erro ao criar ministério: ${error.message}`);
    },
  });

  const updateMinistry = api.ministry.update.useMutation({
    onSuccess: () => {
      toast.success("Ministério atualizado com sucesso");
      onDone();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ministério: ${error.message}`);
    },
  });

  const onSubmit = (data: MinistryFormData) => {
    if (ministry) {
      updateMinistry.mutate({ id: ministry.id, ...data });
    } else {
      createMinistry.mutate(data);
    }
  };

  const isLoading = createMinistry.isPending || updateMinistry.isPending;
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ministry-name">Nome do ministério *</Label>
        <Input
          id="ministry-name"
          {...form.register("name")}
          placeholder="Ex: Louvor, Diaconia, Educação..."
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ministry-description">Descrição</Label>
        <Textarea
          id="ministry-description"
          {...form.register("description")}
          placeholder="Descreva as atividades deste ministério..."
          rows={3}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
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
          {ministry ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

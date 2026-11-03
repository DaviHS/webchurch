"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ministrySchema, type MinistryFormData } from "@/validators/ministry";
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

export type Ministry = RouterOutputs["ministry"]["list"][number];

interface MinistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry | null;
}

export function MinistryDialog({ open, onOpenChange, ministry }: MinistryDialogProps) {
  const isEditing = ministry !== null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditing ? "Editar ministério" : "Novo ministério"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditing ? "Atualize os dados do ministério" : "Adicione um novo ministério à igreja"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <MinistryForm key={ministry?.id ?? "new"} ministry={ministry} onDone={() => onOpenChange(false)} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface MinistryFormProps {
  ministry: Ministry | null;
  onDone: () => void;
}

function MinistryForm({ ministry, onDone }: MinistryFormProps) {
  const utils = api.useUtils();
  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: ministry?.name ?? "",
      description: ministry?.description ?? "",
    },
  });

  const handleSaved = async () => {
    onDone();
    await Promise.all([utils.ministry.getMinistryStats.invalidate(), utils.ministry.list.invalidate()]);
  };

  const createMinistryMutation = api.ministry.create.useMutation(
    mutationFeedback({
      success: "Ministério criado com sucesso",
      error: "Erro ao criar ministério",
      onSuccess: handleSaved,
    })
  );

  const updateMinistryMutation = api.ministry.update.useMutation(
    mutationFeedback({
      success: "Ministério atualizado com sucesso",
      error: "Erro ao atualizar ministério",
      onSuccess: handleSaved,
    })
  );

  const handleSubmit = (data: MinistryFormData) => {
    if (ministry) {
      updateMinistryMutation.mutate({ id: ministry.id, ...data });
    } else {
      createMinistryMutation.mutate(data);
    }
  };

  const isPending = createMinistryMutation.isPending || updateMinistryMutation.isPending;
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ministry-name">Nome do ministério *</Label>
          <Input
            id="ministry-name"
            {...form.register("name")}
            placeholder="Ex: Louvor, Diaconia, Educação..."
            disabled={isPending}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ministry-description">Descrição</Label>
          <Textarea
            id="ministry-description"
            {...form.register("description")}
            placeholder="Descreva as atividades deste ministério..."
            rows={3}
            disabled={isPending}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        <FormDialogFooterActions
          isPending={isPending}
          submitLabel={ministry ? "Salvar" : "Criar ministério"}
          onCancel={onDone}
        />
      </ResponsiveDialogFooter>
    </form>
  );
}

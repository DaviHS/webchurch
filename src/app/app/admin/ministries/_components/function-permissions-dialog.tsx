"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionChecklist } from "@/components/permission-checklist";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import type { Permission } from "@/lib/permissions";
import { api } from "@/trpc/react";

interface FunctionPermissionsDialogProps {
  fn: { id: number; name: string } | null;
  current: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PermissionsForm({ fn, current, onDone }: { fn: { id: number; name: string }; current: Permission[]; onDone: () => void }) {
  const utils = api.useUtils();
  const [value, setValue] = useState(() => new Set(current));

  const save = api.access.setFunctionPermissions.useMutation(
    mutationFeedback({
      success: "Permissões salvas",
      error: "Erro ao salvar as permissões",
      onSuccess: async () => {
        await Promise.all([utils.access.listFunctionPermissions.invalidate(), utils.access.me.invalidate()]);
        onDone();
      },
    }),
  );

  return (
    <>
      <ResponsiveDialogBody className="pb-4">
        <PermissionChecklist value={value} onChange={setValue} />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => save.mutate({ functionId: fn.id, permissions: [...value] })} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar permissões"}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

export function FunctionPermissionsDialog({ fn, current, open, onOpenChange }: FunctionPermissionsDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="min-w-0 break-words">Permissões: {fn?.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Quem tiver esta função, em qualquer ministério, recebe estas permissões. Se tiver outras funções, elas se somam.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {fn && open && <PermissionsForm key={fn.id} fn={fn} current={current} onDone={() => onOpenChange(false)} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

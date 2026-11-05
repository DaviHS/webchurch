"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PERMISSION_GROUPS, type Permission } from "@/lib/permissions";
import { api } from "@/trpc/react";
import type { Ministry } from "./ministry-dialog";

function PermissionChecklist({
  value,
  onChange,
}: {
  value: Set<Permission>;
  onChange: (next: Set<Permission>) => void;
}) {
  const toggle = (permission: Permission, checked: boolean) => {
    const next = new Set(value);
    if (checked) next.add(permission);
    else next.delete(permission);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</p>
          {group.items.map((item) => (
            <label key={item.key} className="flex items-start gap-3 rounded-md border p-2.5 text-sm">
              <Checkbox
                checked={value.has(item.key)}
                onCheckedChange={(checked) => toggle(item.key, checked === true)}
              />
              <span className="min-w-0">
                <span className="block font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

function PermissionsForm({
  ministryId,
  initial,
  functions,
  onDone,
}: {
  ministryId: number;
  initial: { base: Permission[]; byFunction: Record<number, Permission[]> };
  functions: { functionId: number; functionName: string }[];
  onDone: () => void;
}) {
  const utils = api.useUtils();
  const [base, setBase] = useState(() => new Set(initial.base));
  const [byFunction, setByFunction] = useState<Record<number, Set<Permission>>>(() =>
    Object.fromEntries(functions.map((fn) => [fn.functionId, new Set(initial.byFunction[fn.functionId] ?? [])])),
  );

  const save = api.access.setMinistryPermissions.useMutation(
    mutationFeedback({
      success: "Permissões salvas",
      error: "Erro ao salvar as permissões",
      onSuccess: async () => {
        await Promise.all([
          utils.access.getMinistryPermissions.invalidate({ ministryId }),
          utils.access.me.invalidate(),
        ]);
        onDone();
      },
    }),
  );

  const submit = () =>
    save.mutate({
      ministryId,
      base: [...base],
      byFunction: functions.map((fn) => ({
        functionId: fn.functionId,
        permissions: [...(byFunction[fn.functionId] ?? [])],
      })),
    });

  return (
    <>
      <ResponsiveDialogBody className="space-y-6 pb-4">
        <section className="space-y-2">
          <h3 className="font-semibold">Todos os membros do ministério</h3>
          <p className="text-xs text-muted-foreground">Vale para qualquer pessoa ativa neste ministério, com ou sem função.</p>
          <PermissionChecklist value={base} onChange={setBase} />
        </section>

        {functions.map((fn) => (
          <section key={fn.functionId} className="space-y-2 border-t pt-4">
            <h3 className="font-semibold">Quem tem a função {fn.functionName}</h3>
            <p className="text-xs text-muted-foreground">Soma-se ao que vale para todos os membros.</p>
            <PermissionChecklist
              value={byFunction[fn.functionId] ?? new Set()}
              onChange={(next) => setByFunction((current) => ({ ...current, [fn.functionId]: next }))}
            />
          </section>
        ))}

        {functions.length === 0 && (
          <p className="border-t pt-4 text-sm text-muted-foreground">
            Este ministério ainda não tem funções. Vincule funções para dar permissões só a quem as exerce.
          </p>
        )}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar permissões"}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

interface MinistryPermissionsDialogProps {
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryPermissionsDialog({ ministry, open, onOpenChange }: MinistryPermissionsDialogProps) {
  const ministryId = ministry?.id ?? 0;
  const enabled = open && ministry !== null;
  const permissions = api.access.getMinistryPermissions.useQuery({ ministryId }, { enabled, staleTime: 0 });
  const functions = api.ministry.getMinistryFunctions.useQuery({ ministryId }, { enabled });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="min-w-0 break-words">Permissões: {ministry?.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Defina o que as pessoas deste ministério podem fazer. As permissões de várias funções e ministérios se somam.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {permissions.data && functions.data && ministry ? (
          <PermissionsForm
            key={`${ministry.id}:${open}`}
            ministryId={ministry.id}
            initial={permissions.data}
            functions={functions.data}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex justify-center py-10">
            {permissions.error ? (
              <p className="text-sm text-destructive">{permissions.error.message}</p>
            ) : (
              <Loader2 className="size-6 animate-spin text-primary" />
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

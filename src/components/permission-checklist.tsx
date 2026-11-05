"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_GROUPS, type Permission } from "@/lib/permissions";

export function PermissionChecklist({
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
              <Checkbox checked={value.has(item.key)} onCheckedChange={(checked) => toggle(item.key, checked === true)} />
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

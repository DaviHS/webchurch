import { Clock, Lock, Unlock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccessStatus = "active" | "pending" | "inactive" | "none";

const ACCESS_STATUS: Record<AccessStatus, { label: string; icon: LucideIcon; className: string }> = {
  active: { label: "Acesso ativo", icon: Unlock, className: "text-success" },
  pending: { label: "Aguardando aprovação", icon: Clock, className: "text-warning" },
  inactive: { label: "Acesso inativo", icon: Lock, className: "text-destructive" },
  none: { label: "Sem acesso", icon: Lock, className: "text-muted-foreground" },
};

export function MemberAccessStatus({ status }: { status: Exclude<AccessStatus, "none"> | null | undefined }) {
  const { label, icon: Icon, className } = ACCESS_STATUS[status ?? "none"];
  return (
    <p className="flex items-center gap-1.5">
      <Icon className={cn("size-4 shrink-0", className)} />
      <span>{label}</span>
    </p>
  );
}

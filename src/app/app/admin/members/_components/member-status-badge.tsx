import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { MemberStatus } from "./types";

const STATUS_STYLES: Record<MemberStatus, { variant: BadgeProps["variant"]; label: string }> = {
  active: { variant: "success", label: "Ativo" },
  inactive: { variant: "muted", label: "Inativo" },
  visiting: { variant: "info", label: "Visitante" },
  transferred: { variant: "warning", label: "Transferido" },
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const { variant, label } = STATUS_STYLES[status];
  return <Badge variant={variant}>{label}</Badge>;
}

import type { BadgeProps } from "@/components/ui/badge";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export const TRANSACTION_TYPES: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  income: { label: "Receita", variant: "success" },
  expense: { label: "Despesa", variant: "destructive" },
  transfer: { label: "Transferência", variant: "info" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
  check: "Cheque",
};

export function amountClassName(type: string): string {
  if (type === "income") return "text-success";
  if (type === "expense") return "text-destructive";
  return "text-foreground";
}

export function balanceClassName(value: number): string {
  return value >= 0 ? "text-success" : "text-destructive";
}

export function normalizeMoneyInput(value: string): string {
  return value.replace(/,/g, ".").replace(/[^\d.-]/g, "");
}

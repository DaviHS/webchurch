import type { BadgeProps } from "@/components/ui/badge";
import type { PAYMENT_METHODS, TRANSACTION_TYPES as TRANSACTION_TYPE_VALUES } from "@/validators/finance";

export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface MonthRef {
  month: number;
  year: number;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export const TRANSACTION_TYPES: Record<TransactionType, { label: string; plural: string; variant: BadgeProps["variant"] }> = {
  income: { label: "Entrada", plural: "Entradas", variant: "success" },
  expense: { label: "Saída", plural: "Saídas", variant: "destructive" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência bancária",
  check: "Cheque",
};

export function transactionTypeLabel(type: string): string {
  return type === "income" || type === "expense" ? TRANSACTION_TYPES[type].label : type;
}

export function paymentMethodLabel(method: string | null | undefined): string | null {
  if (!method) return null;
  return method in PAYMENT_METHOD_LABELS ? PAYMENT_METHOD_LABELS[method as PaymentMethod] : method;
}

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

export function toCents(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export function formatMonthYear({ month, year }: MonthRef): string {
  const name = monthName(month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

export function currentMonthRef(): MonthRef {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function shiftMonth({ month, year }: MonthRef, delta: number): MonthRef {
  const index = year * 12 + (month - 1) + delta;
  return { month: (index % 12) + 1, year: Math.floor(index / 12) };
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function formatVariation(current: number, previous: number, previousMonth: number, emptyLabel: string): string {
  const name = monthName(previousMonth);
  if (previous === 0) return current === 0 ? `Igual a ${name}` : `${emptyLabel} em ${name}`;
  const percent = Math.round(((current - previous) / previous) * 100);
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}% vs ${name}`;
}

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type DateInput = Date | string | null | undefined;

export function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export const formatTime = (time: string | null | undefined) => {
  if (!time) return "";
  return time.includes(":") ? time.slice(0, 5) : `${time.substring(0, 2)}:${time.substring(2, 4)}`;
};

export function formatDate(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "";
}

export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "";
}

export function formatDateRelative(value: DateInput): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) : "";
}

export function formatDateRange(startDate: DateInput, endDate: DateInput): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

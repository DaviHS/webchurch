import { format, endOfDay, startOfDay, subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatTime = (time: string) => {
  if (!time) return '';
  return time.includes(':') ? time : `${time.substring(0, 2)}:${time.substring(2)}`;
};

export function formatTimeDate(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateLong(date: Date | string | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "PPP", { locale: ptBR });
}

export function formatDateRelative(date: Date | string | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function getDaysAgo(days: number) {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days));
  return { startDate, endDate };
}
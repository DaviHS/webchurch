import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const FILTER_STORAGE_KEY = "call-filters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSecondsToTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs]
    .map(unit => String(unit).padStart(2, "0"))
    .join(":");
}

export const statusTranslations: Record<string, string> = {
  answered: "Atendida",
  busy: "Ocupado",
  cancelled: "Cancelada",
  failed: "Falha",
  missed: "Perdida",
  no_answer: "Não Atendida",
  voicemail: "Correio de voz",
  outbound: "Realizada",
  inbound: "Recebida",
}

export const cleanNullValues = <T extends Record<string, unknown>>(obj: T): Partial<{ [K in keyof T]: NonNullable<T[K]> }> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<{ [K in keyof T]: NonNullable<T[K]> }>;
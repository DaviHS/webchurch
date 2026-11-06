import { lt } from "drizzle-orm";
import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

/** Por quanto tempo o histórico de alterações é guardado (ele contém nomes e dados enviados nos formulários). */
export const AUDIT_RETENTION_MONTHS = 24;
/** Em vez de uma tarefa agendada, a limpeza roda de vez em quando junto com um registro novo. */
const PURGE_CHANCE = 0.02;

const SECRET_KEY = /password|senha|token|secret/i;
const MAX_STRING = 200;
const MAX_ITEMS = 20;
const MAX_DEPTH = 3;

/** Reduz a entrada da mutação a algo pequeno e sem segredos para guardar no histórico. */
export function sanitizeAuditInput(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return "…";
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((item) => sanitizeAuditInput(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_ITEMS)) {
      out[key] = SECRET_KEY.test(key) ? "***" : sanitizeAuditInput(item, depth + 1);
    }
    return out;
  }
  return null;
}

async function purgeOldAudit() {
  const limit = new Date();
  limit.setMonth(limit.getMonth() - AUDIT_RETENTION_MONTHS);
  await db.delete(auditLogs).where(lt(auditLogs.createdAt, limit));
}

export async function recordAudit(entry: { userId: number | null; userLabel: string; action: string; target?: string | null; input: unknown }) {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      userLabel: entry.userLabel.slice(0, 150),
      action: entry.action,
      target: entry.target ?? null,
      input: sanitizeAuditInput(entry.input),
    });
    if (Math.random() < PURGE_CHANCE) await purgeOldAudit();
  } catch (error) {
    // O histórico nunca deve impedir a ação em si.
    console.error("[audit] falha ao registrar", error);
  }
}

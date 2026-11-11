import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { presentationCommands, presentationSessions } from "@/server/db/schema";

export const SESSION_IDLE_HOURS = 24;
export const COMMAND_KEEP_MINUTES = 10;

export const sessionExpiry = sql`now() + interval '${sql.raw(String(SESSION_IDLE_HOURS))} hours'`;

export async function cleanupPresentationSessions(): Promise<{ sessions: number; commands: number }> {
  const sessions = await db
    .delete(presentationSessions)
    .where(sql`${presentationSessions.expiresAt} <= now()`)
    .returning({ id: presentationSessions.id });
  const commands = await db
    .delete(presentationCommands)
    .where(sql`${presentationCommands.createdAt} < now() - interval '${sql.raw(String(COMMAND_KEEP_MINUTES))} minutes'`)
    .returning({ id: presentationCommands.id });
  return { sessions: sessions.length, commands: commands.length };
}

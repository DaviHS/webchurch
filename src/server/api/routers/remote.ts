import { randomInt } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { presentationCommands, presentationSessions } from "@/server/db/schema";
import { cleanupPresentationSessions, sessionExpiry } from "@/server/presentation-cleanup";
import {
  REMOTE_CODE_LENGTH,
  remoteCodeSchema,
  remoteCommandSchema,
  remoteOutlineSchema,
  remoteStateSchema,
  type RemoteCommand,
  type RemoteOutline,
} from "@/components/presentation/remote-protocol";

const sessionIsAlive = sql`${presentationSessions.expiresAt} > now()`;

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Código não encontrado ou expirado. Confira o código no computador." });

async function findSession(code: string, userId?: number) {
  const [session] = await db
    .select({ id: presentationSessions.id })
    .from(presentationSessions)
    .where(
      and(
        eq(presentationSessions.code, code),
        sessionIsAlive,
        userId === undefined ? undefined : eq(presentationSessions.userId, userId),
      ),
    )
    .limit(1);
  if (!session) throw notFound();
  return session;
}

async function lastCommandId(sessionId: number): Promise<number> {
  const [row] = await db
    .select({ max: sql<number | null>`max(${presentationCommands.id})` })
    .from(presentationCommands)
    .where(eq(presentationCommands.sessionId, sessionId));
  return row?.max ?? 0;
}

const newCode = () => String(randomInt(10 ** REMOTE_CODE_LENGTH)).padStart(REMOTE_CODE_LENGTH, "0");

export const remoteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ title: z.string().max(200), deckKey: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
    const userId = Number(ctx.session.user.id);

    await cleanupPresentationSessions();

    const [existing] = await db
      .select({ id: presentationSessions.id, code: presentationSessions.code })
      .from(presentationSessions)
      .where(
        and(
          eq(presentationSessions.userId, userId),
          eq(presentationSessions.deckKey, input.deckKey),
          sessionIsAlive,
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(presentationSessions)
        .set({ title: input.title, expiresAt: sessionExpiry })
        .where(eq(presentationSessions.id, existing.id));
      return { code: existing.code, lastCommandId: await lastCommandId(existing.id) };
    }

    for (let attempt = 0; attempt < 10; attempt++) {
      const [created] = await db
        .insert(presentationSessions)
        .values({
          code: newCode(),
          userId,
          deckKey: input.deckKey,
          title: input.title,
          expiresAt: sessionExpiry,
        })
        .onConflictDoNothing({ target: presentationSessions.code })
        .returning({ code: presentationSessions.code });
      if (created) return { code: created.code, lastCommandId: 0 };
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar o código. Tente de novo." });
  }),

  listSessions: protectedProcedure.query(async () => {
    await cleanupPresentationSessions();
    return db
      .select({ code: presentationSessions.code, title: presentationSessions.title })
      .from(presentationSessions)
      .where(and(sessionIsAlive, sql`${presentationSessions.updatedAt} > now() - interval '2 minutes'`))
      .orderBy(desc(presentationSessions.updatedAt))
      .limit(10);
  }),

  publish: protectedProcedure
    .input(z.object({ code: remoteCodeSchema, state: remoteStateSchema, outline: remoteOutlineSchema.optional() }))
    .mutation(async ({ ctx, input }) => {
      const session = await findSession(input.code, Number(ctx.session.user.id));
      await db
        .update(presentationSessions)
        .set({
          state: input.state,
          title: input.state.title,
          updatedAt: sql`now()`,
          expiresAt: sessionExpiry,
          ...(input.outline
            ? { outline: input.outline, outlineRev: sql`${presentationSessions.outlineRev} + 1` }
            : {}),
        })
        .where(eq(presentationSessions.id, session.id));
    }),

  pollCommands: protectedProcedure
    .input(z.object({ code: remoteCodeSchema, afterId: z.number().int().min(0) }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({ id: presentationCommands.id, command: presentationCommands.command })
        .from(presentationCommands)
        .innerJoin(presentationSessions, eq(presentationSessions.id, presentationCommands.sessionId))
        .where(
          and(
            eq(presentationSessions.code, input.code),
            eq(presentationSessions.userId, Number(ctx.session.user.id)),
            sessionIsAlive,
            gt(presentationCommands.id, input.afterId),
          ),
        )
        .orderBy(asc(presentationCommands.id))
        .limit(50);

      const commands: { id: number; command: RemoteCommand }[] = [];
      for (const row of rows) {
        const parsed = remoteCommandSchema.safeParse(row.command);
        if (parsed.success) commands.push({ id: row.id, command: parsed.data });
      }
      return { commands, lastId: rows[rows.length - 1]?.id ?? input.afterId };
    }),

  getState: protectedProcedure.input(z.object({ code: remoteCodeSchema })).query(async ({ input }) => {
    const [row] = await db
      .select({
        state: presentationSessions.state,
        title: presentationSessions.title,
        outlineRev: presentationSessions.outlineRev,
        ageSeconds: sql<number>`extract(epoch from (now() - ${presentationSessions.updatedAt}))::float8`,
      })
      .from(presentationSessions)
      .where(and(eq(presentationSessions.code, input.code), sessionIsAlive))
      .limit(1);
    if (!row) throw notFound();

    const state = remoteStateSchema.safeParse(row.state);
    return {
      state: state.success ? state.data : null,
      title: row.title,
      outlineRev: row.outlineRev,
      ageSeconds: Number(row.ageSeconds),
    };
  }),

  getOutline: protectedProcedure
    .input(z.object({ code: remoteCodeSchema, rev: z.number().int() }))
    .query(async ({ input }): Promise<RemoteOutline> => {
      const [row] = await db
        .select({ outline: presentationSessions.outline })
        .from(presentationSessions)
        .where(and(eq(presentationSessions.code, input.code), sessionIsAlive))
        .limit(1);
      if (!row) throw notFound();
      const outline = remoteOutlineSchema.safeParse(row.outline);
      return outline.success ? outline.data : [];
    }),

  sendCommand: protectedProcedure
    .input(z.object({ code: remoteCodeSchema, command: remoteCommandSchema }))
    .mutation(async ({ input }) => {
      const session = await findSession(input.code);
      await db.insert(presentationCommands).values({ sessionId: session.id, command: input.command });
    }),

  close: protectedProcedure.input(z.object({ code: remoteCodeSchema })).mutation(async ({ ctx, input }) => {
    await db
      .delete(presentationSessions)
      .where(and(eq(presentationSessions.code, input.code), eq(presentationSessions.userId, Number(ctx.session.user.id))));
  }),
});

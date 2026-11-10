import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { bibleReadingPlans, bibleReadingProgress } from "@/server/db/schema";
import { getPlan } from "@/lib/bible-plans";

const userIdOf = (ctx: { session: { user: { id?: string } } }) => {
  const id = Number(ctx.session.user.id);
  if (!Number.isInteger(id)) throw new TRPCError({ code: "UNAUTHORIZED" });
  return id;
};

const planKey = z.string().min(1).max(30);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function assertPlan(key: string) {
  const plan = getPlan(key);
  if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
  return plan;
}

function assertPlausibleDate(value: string) {
  const sent = Date.parse(`${value}T12:00:00Z`);
  if (Number.isNaN(sent) || Math.abs(sent - Date.now()) > 36 * 60 * 60 * 1000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Data inválida" });
  }
}

export const bibleReadingPlanProcedures = {
  planState: protectedProcedure.query(async ({ ctx }) => {
    const userId = userIdOf(ctx);
    const [plans, progress] = await Promise.all([
      db.select().from(bibleReadingPlans).where(eq(bibleReadingPlans.userId, userId)),
      db.select().from(bibleReadingProgress).where(eq(bibleReadingProgress.userId, userId)),
    ]);
    return plans.map((plan) => ({
      planKey: plan.planKey,
      startedOn: plan.startedOn,
      completedDays: progress.filter((row) => row.planKey === plan.planKey).map((row) => row.day),
    }));
  }),

  startPlan: protectedProcedure.input(z.object({ planKey, today: isoDate })).mutation(async ({ ctx, input }) => {
    assertPlan(input.planKey);
    assertPlausibleDate(input.today);
    await db
      .insert(bibleReadingPlans)
      .values({ userId: userIdOf(ctx), planKey: input.planKey, startedOn: input.today })
      .onConflictDoNothing();
    return { ok: true };
  }),

  leavePlan: protectedProcedure.input(z.object({ planKey })).mutation(async ({ ctx, input }) => {
    const userId = userIdOf(ctx);
    await db.batch([
      db.delete(bibleReadingProgress).where(and(eq(bibleReadingProgress.userId, userId), eq(bibleReadingProgress.planKey, input.planKey))),
      db.delete(bibleReadingPlans).where(and(eq(bibleReadingPlans.userId, userId), eq(bibleReadingPlans.planKey, input.planKey))),
    ]);
    return { ok: true };
  }),

  setPlanDay: protectedProcedure
    .input(z.object({ planKey, day: z.number().int().min(1).max(400), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = userIdOf(ctx);
      const plan = assertPlan(input.planKey);
      if (input.day > plan.days) throw new TRPCError({ code: "BAD_REQUEST", message: "Dia fora do plano" });
      const [enrolled] = await db
        .select({ planKey: bibleReadingPlans.planKey })
        .from(bibleReadingPlans)
        .where(and(eq(bibleReadingPlans.userId, userId), eq(bibleReadingPlans.planKey, input.planKey)))
        .limit(1);
      if (!enrolled) throw new TRPCError({ code: "NOT_FOUND", message: "Você ainda não começou este plano" });

      if (input.done) {
        await db.insert(bibleReadingProgress).values({ userId, planKey: input.planKey, day: input.day }).onConflictDoNothing();
      } else {
        await db
          .delete(bibleReadingProgress)
          .where(
            and(
              eq(bibleReadingProgress.userId, userId),
              eq(bibleReadingProgress.planKey, input.planKey),
              eq(bibleReadingProgress.day, input.day),
            ),
          );
      }
      return { ok: true };
    }),
};

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  auditLogs,
  bibleMarks,
  bibleReadingPlans,
  bibleReadingProgress,
  eventParticipants,
  events,
  financialTransactions,
  functions,
  memberMinistries,
  members,
  ministries,
  users,
} from "@/server/db/schema";

const manageMembers = can("members.manage");

const EXPORT_VERSION = 1;

const stamp = () => new Date().toISOString();

async function loadMemberData(memberId: number, includeFinance: boolean) {
  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });

  const [ministryRows, participationRows, userRows, financeRows] = await Promise.all([
    db
      .select({
        ministry: ministries.name,
        function: functions.name,
        joinedAt: memberMinistries.joinedAt,
        leftAt: memberMinistries.leftAt,
        isActive: memberMinistries.isActive,
        notes: memberMinistries.notes,
      })
      .from(memberMinistries)
      .innerJoin(ministries, eq(memberMinistries.ministryId, ministries.id))
      .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
      .where(eq(memberMinistries.memberId, memberId))
      .orderBy(asc(memberMinistries.joinedAt)),
    db
      .select({ event: events.title, date: events.date, role: eventParticipants.role, instrument: eventParticipants.instrument })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(eq(eventParticipants.memberId, memberId))
      .orderBy(asc(events.date)),
    db
      .select({
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        approvedAt: users.approvedAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(eq(users.memberId, memberId)),
    includeFinance
      ? db
          .select({
            date: financialTransactions.transactionDate,
            type: financialTransactions.type,
            amount: financialTransactions.amount,
            description: financialTransactions.description,
          })
          .from(financialTransactions)
          .where(eq(financialTransactions.memberId, memberId))
          .orderBy(asc(financialTransactions.transactionDate))
      : Promise.resolve(null),
  ]);

  return {
    member,
    ministries: ministryRows,
    eventParticipations: participationRows,
    access: userRows,
    financialTransactions: financeRows ?? "Omitido: você não tem permissão para ver as finanças.",
  };
}

export const privacyRouter = createTRPCRouter({
  exportMember: manageMembers.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
    const data = await loadMemberData(input.id, ctx.access.permissions.has("finance.access"));
    return { version: EXPORT_VERSION, exportedAt: stamp(), ...data };
  }),

  anonymizeMember: manageMembers.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    const [member] = await db.select().from(members).where(eq(members.id, input.id)).limit(1);
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });

    const [linkedUser] = await db.select({ id: users.id }).from(users).where(eq(users.memberId, input.id)).limit(1);
    const fullName = `${member.firstName} ${member.lastName}`.trim();

    const steps: BatchItem<"pg">[] = [
      db
        .update(members)
        .set({
          firstName: "Pessoa",
          lastName: "removida",
          email: null,
          phone: null,
          whatsapp: null,
          birthDate: null,
          gender: null,
          maritalStatus: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          baptismDate: null,
          memberSince: null,
          profession: null,
          emergencyContact: null,
          emergencyPhone: null,
          notes: null,
          status: "inactive",
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id)),
      db
        .update(memberMinistries)
        .set({ notes: null, isActive: false, leftAt: sql`coalesce(${memberMinistries.leftAt}, now())` })
        .where(eq(memberMinistries.memberId, input.id)),
      db
        .update(auditLogs)
        .set({ target: "Membro removido", input: null })
        .where(
          or(
            ilike(auditLogs.target, `%${fullName.replace(/[%_\\]/g, "\\$&")}%`),
            and(sql`${auditLogs.action} like 'member.%'`, sql`${auditLogs.input}->>'id' = ${String(input.id)}`),
          ),
        ),
    ];

    if (linkedUser) {
      steps.push(
        db.delete(bibleMarks).where(eq(bibleMarks.userId, linkedUser.id)),
        db.delete(bibleReadingProgress).where(eq(bibleReadingProgress.userId, linkedUser.id)),
        db.delete(bibleReadingPlans).where(eq(bibleReadingPlans.userId, linkedUser.id)),
        db
          .update(users)
          .set({
            email: `removido-${linkedUser.id}@invalid`,
            passwordHash: randomBytes(24).toString("hex"),
            status: "inactive",
            resetToken: null,
            resetTokenExpires: null,
            bibleVersion: null,
            bibleBook: null,
            bibleChapter: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, linkedUser.id)),
      );
    }

    const [first, ...rest] = steps;
    if (first) await db.batch([first, ...rest]);
    return { anonymized: true, hadAccess: Boolean(linkedUser) };
  }),

  exportMyData: protectedProcedure.query(async ({ ctx }) => {
    const userId = Number(ctx.session.user.id);
    if (!Number.isInteger(userId)) throw new TRPCError({ code: "UNAUTHORIZED" });

    const [user] = await db
      .select({
        email: users.email,
        status: users.status,
        memberId: users.memberId,
        createdAt: users.createdAt,
        approvedAt: users.approvedAt,
        lastLogin: users.lastLogin,
        bibleVersion: users.bibleVersion,
        bibleBook: users.bibleBook,
        bibleChapter: users.bibleChapter,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

    const [marks, plans, planDays, memberData] = await Promise.all([
      db
        .select({
          book: bibleMarks.bookId,
          chapter: bibleMarks.chapter,
          verse: bibleMarks.verse,
          color: bibleMarks.color,
          note: bibleMarks.note,
          updatedAt: bibleMarks.updatedAt,
        })
        .from(bibleMarks)
        .where(eq(bibleMarks.userId, userId))
        .orderBy(asc(bibleMarks.bookId), asc(bibleMarks.chapter), asc(bibleMarks.verse)),
      db
        .select({ plan: bibleReadingPlans.planKey, startedOn: bibleReadingPlans.startedOn })
        .from(bibleReadingPlans)
        .where(eq(bibleReadingPlans.userId, userId)),
      db
        .select({ plan: bibleReadingProgress.planKey, day: bibleReadingProgress.day, completedAt: bibleReadingProgress.completedAt })
        .from(bibleReadingProgress)
        .where(eq(bibleReadingProgress.userId, userId))
        .orderBy(asc(bibleReadingProgress.planKey), asc(bibleReadingProgress.day)),
      user.memberId ? loadMemberData(user.memberId, false) : Promise.resolve(null),
    ]);

    const { memberId: _memberId, ...account } = user;
    void _memberId;
    return {
      version: EXPORT_VERSION,
      exportedAt: stamp(),
      account,
      bibleMarksAndNotes: marks,
      bibleReadingPlans: plans.map((plan) => ({ ...plan, completedDays: planDays.filter((row) => row.plan === plan.plan) })),
      memberRecord: memberData
        ? {
            member: memberData.member,
            ministries: memberData.ministries,
            eventParticipations: memberData.eventParticipations,
          }
        : null,
    };
  }),
});

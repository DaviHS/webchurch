import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  members,
  memberMinistries,
  users,
  functions,
  functionPermissions,
  ministries,
} from "@/server/db/schema";
import { memberSchema } from "@/validators/member";
import { isPermission } from "@/lib/permissions";
import type { Access } from "@/server/access";
import {
  eq,
  and,
  isNotNull,
  isNull,
  or,
  sql,
  inArray,
  asc,
  type SQL,
} from "drizzle-orm";
import { cleanEmptyStrings, emptyStringsToNull } from "@/lib/formatters";
import type { BatchItem } from "drizzle-orm/batch";
import { birthdayThisMonth } from "@/lib/birthdays";

type MinistryInput = { ministryId: number; functionId?: number | null };

const toMemberMinistryRows = (memberId: number, ministriesInput: MinistryInput[] = []) =>
  ministriesInput
    .filter((m) => m.ministryId > 0)
    .map((m) => ({
      memberId,
      ministryId: m.ministryId,
      functionId: m.functionId ?? null,
    }));

const manageMembers = can("members.manage");

const memberFilters = z.object({
  search: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "visiting", "transferred"]).optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  hasAccess: z.enum(["true", "false"]).optional().nullable(),
  /** Só quem faz aniversário neste mês (1 a 12); a lista passa a ser ordenada pelo dia. */
  birthMonth: z.number().int().min(1).max(12).optional().nullable(),
});

function memberConditions({ search, status, gender, hasAccess, birthMonth }: z.infer<typeof memberFilters>): SQL[] {
  const conditions: SQL[] = [eq(members.status, status ?? "active")];
  if (gender) conditions.push(eq(members.gender, gender));

  const term = search?.trim().toLowerCase();
  if (term) {
    const searchLower = `%${term}%`;
    const searchConditions = or(
      sql`LOWER(${members.firstName}) LIKE ${searchLower}`,
      sql`LOWER(${members.lastName}) LIKE ${searchLower}`,
      sql`LOWER(${members.email}) LIKE ${searchLower}`,
      sql`LOWER(${members.firstName} || ' ' || ${members.lastName}) LIKE ${searchLower}`,
    );
    if (searchConditions) conditions.push(searchConditions);
  }

  if (birthMonth) conditions.push(sql`extract(month from ${members.birthDate}) = ${birthMonth}`);

  if (hasAccess === "true") conditions.push(isNotNull(users.id));
  else if (hasAccess === "false") conditions.push(isNull(users.id));
  return conditions;
}

async function assertCanGrantFunctions(access: Access, ministriesInput: MinistryInput[] = [], alreadyHeld = new Set<number>()) {
  const functionIds = [
    ...new Set(ministriesInput.flatMap((m) => (m.functionId && !alreadyHeld.has(m.functionId) ? [m.functionId] : []))),
  ];
  if (functionIds.length === 0) return;

  const granted = await db
    .select({ permission: functionPermissions.permission })
    .from(functionPermissions)
    .where(inArray(functionPermissions.functionId, functionIds));

  if (granted.some((row) => !isPermission(row.permission) || !access.permissions.has(row.permission))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não pode atribuir funções com permissões que você mesmo não tem.",
    });
  }
}

export const memberRouter = createTRPCRouter({
  create: manageMembers.input(memberSchema).mutation(async ({ input, ctx }) => {
    await assertCanGrantFunctions(ctx.access, input.ministries);
    const { ministries: ministriesInput, ...memberData } = input;
    const cleanedData = cleanEmptyStrings(memberData);

    const [newMember] = await db.insert(members).values(cleanedData).returning();

    if (!newMember) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar membro" });
    }

    const rows = toMemberMinistryRows(newMember.id, ministriesInput);
    if (rows.length > 0) {
      await db.insert(memberMinistries).values(rows);
    }

    return newMember;
  }),

  /** Quantos membros batem com os filtros (para a paginação). */
  count: protectedProcedure.input(memberFilters).query(async ({ input }) => {
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(members)
      .leftJoin(users, eq(members.id, users.memberId))
      .where(and(...memberConditions(input)));
    return row?.total ?? 0;
  }),

  list: protectedProcedure
    .input(
      memberFilters.extend({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, birthMonth } = input;
      const offset = (page - 1) * limit;
      const conditions = memberConditions(input);

      const result = await db
        .select({
          member: members,
          user: users,
        })
        .from(members)
        .leftJoin(users, eq(members.id, users.memberId))
        .where(and(...conditions))
        .orderBy(
          ...(birthMonth ? [asc(sql`extract(day from ${members.birthDate})`)] : []),
          asc(members.firstName),
          asc(members.lastName),
          asc(members.id),
        )
        .limit(limit)
        .offset(offset);

      if (result.length === 0) return [];

      const memberIds = result.map(r => r.member.id);

      const ministriesData = await db
        .select({
          memberId: memberMinistries.memberId,
          ministryId: memberMinistries.ministryId,
          functionId: memberMinistries.functionId,
          ministryName: ministries.name,
          functionName: functions.name,
        })
        .from(memberMinistries)
        .innerJoin(ministries, eq(memberMinistries.ministryId, ministries.id))
        .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
        .where(
          and(
            inArray(memberMinistries.memberId, memberIds),
            eq(memberMinistries.isActive, true),
            eq(ministries.isActive, true)
          )
        )
        .orderBy(asc(ministries.name));

      const ministriesByMember: Record<number, {
        ministryId: number;
        ministryName: string;
        functionId: number | null;
        functionName: string | null
      }[]> = {};

      ministriesData.forEach((cur) => {
        (ministriesByMember[cur.memberId] ??= []).push({
          ministryId: cur.ministryId,
          ministryName: cur.ministryName || "Ministério sem nome",
          functionId: cur.functionId,
          functionName: cur.functionName,
        });
      });

      return result.map(r => ({
        members: {
          ...r.member,
          ministries: ministriesByMember[r.member.id] ?? [],
        },
        users: r.user
          ? (({ passwordHash: _ph, resetToken: _rt, resetTokenExpires: _rte, ...safeUser }) => safeUser)(r.user)
          : null,
      }));
    }),

  /** Aniversariantes do mês de hoje (membros ativos), por dia. */
  birthdaysOfMonth: manageMembers
    .input(z.object({ today: z.string().regex(/^d{4}-d{2}-d{2}$/) }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          birthDate: members.birthDate,
          whatsapp: members.whatsapp,
          phone: members.phone,
        })
        .from(members)
        .where(and(eq(members.status, "active"), isNotNull(members.birthDate)));

      return rows
        .flatMap((row) => {
          const birthday = row.birthDate ? birthdayThisMonth(row.birthDate, input.today) : null;
          return birthday ? [{ id: row.id, firstName: row.firstName, lastName: row.lastName, whatsapp: row.whatsapp ?? row.phone, ...birthday }] : [];
        })
        .sort((a, b) => a.day - b.day || a.firstName.localeCompare(b.firstName, "pt-BR"));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.id, input.id))
        .limit(1);

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });

      const memberMinistriesData = await db
        .select({
          ministryId: memberMinistries.ministryId,
          functionId: memberMinistries.functionId,
          joinedAt: memberMinistries.joinedAt,
          isActive: memberMinistries.isActive,
          ministryName: ministries.name,
          functionName: functions.name,
        })
        .from(memberMinistries)
        .innerJoin(ministries, eq(memberMinistries.ministryId, ministries.id))
        .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
        .where(
          and(
            eq(memberMinistries.memberId, input.id),
            eq(memberMinistries.isActive, true),
            eq(ministries.isActive, true)
          )
        )
        .orderBy(asc(ministries.name));

      return {
        ...member,
        ministries: memberMinistriesData,
      };
    }),

  update: manageMembers
    .input(
      z.object({
        id: z.number(),
        data: memberSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const held = await db
        .select({ functionId: memberMinistries.functionId })
        .from(memberMinistries)
        .where(and(eq(memberMinistries.memberId, input.id), eq(memberMinistries.isActive, true)));
      await assertCanGrantFunctions(
        ctx.access,
        input.data.ministries,
        new Set(held.flatMap((row) => (row.functionId === null ? [] : [row.functionId]))),
      );

      const { ministries: ministriesInput, ...memberData } = input.data;
      const updateData = {
        ...emptyStringsToNull(memberData),
        firstName: memberData.firstName,
        lastName: memberData.lastName,
      };

      const updateMember = db
        .update(members)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      // Só mexe no que mudou: vínculos iguais ficam como estão (com a data de entrada), os que saíram são encerrados
      // e só os novos são criados. Antes, cada salvamento apagava a data de entrada e acumulava linhas repetidas.
      const wanted = toMemberMinistryRows(input.id, ministriesInput);
      const current = await db
        .select({ id: memberMinistries.id, ministryId: memberMinistries.ministryId, functionId: memberMinistries.functionId })
        .from(memberMinistries)
        .where(and(eq(memberMinistries.memberId, input.id), eq(memberMinistries.isActive, true)));
      const sameLink = (x: { ministryId: number; functionId: number | null }, y: { ministryId: number; functionId: number | null }) =>
        x.ministryId === y.ministryId && x.functionId === y.functionId;
      const toEnd = current.filter((row) => !wanted.some((want) => sameLink(row, want)));
      const toAdd = wanted.filter((want) => !current.some((row) => sameLink(row, want)));

      const statements: BatchItem<"pg">[] = [];
      if (toEnd.length > 0) {
        statements.push(
          db
            .update(memberMinistries)
            .set({ isActive: false, leftAt: new Date() })
            .where(inArray(memberMinistries.id, toEnd.map((row) => row.id))),
        );
      }
      if (toAdd.length > 0) statements.push(db.insert(memberMinistries).values(toAdd));
      const [result] = await db.batch([updateMember, ...statements]);

      const updatedMember = result[0];
      if (!updatedMember) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });
      }

      return updatedMember;
    }),

  /** Desativa o membro e também a conta de acesso dele (sem isso, a pessoa continuaria entrando no sistema). */
  deactivate: manageMembers
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [account] = await db.select({ id: users.id }).from(users).where(eq(users.memberId, input.id)).limit(1);
      if (account && String(account.id) === String(ctx.session.user.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode desativar o seu próprio cadastro." });
      }

      const now = new Date();
      const [deactivated] = await db
        .update(members)
        .set({ status: "inactive", updatedAt: now })
        .where(eq(members.id, input.id))
        .returning();

      if (!deactivated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });
      }

      await db.update(users).set({ status: "inactive", updatedAt: now }).where(eq(users.memberId, input.id));
      return deactivated;
    }),

  /** Volta a ativar um membro desativado. A conta de acesso só volta se já tinha sido aprovada (cadastro rejeitado não volta). */
  reactivate: manageMembers
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const [member] = await db
        .update(members)
        .set({ status: "active", updatedAt: now })
        .where(eq(members.id, input.id))
        .returning();

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });
      }

      const restored = await db
        .update(users)
        .set({ status: "active", updatedAt: now })
        .where(and(eq(users.memberId, input.id), eq(users.status, "inactive"), isNotNull(users.approvedAt)))
        .returning({ id: users.id });

      return { member, accessRestored: restored.length > 0 };
    }),
});

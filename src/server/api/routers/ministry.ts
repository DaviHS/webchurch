import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { ministries, functions, ministryFunctions, memberMinistries, members } from "@/server/db/schema"
import { eq, and, inArray, asc, not, countDistinct, ne, sql } from "drizzle-orm"
import { ministrySchema, functionSchema, ministryFunctionSchema } from "@/validators/ministry"

const presentMemberStatuses = ["active", "visiting"] as const

const manageMinistries = can("ministries.manage")

/** Nome repetido: diz com clareza se o outro está ativo ou desativado (e então é só reativar). */
async function assertUniqueName(kind: "ministry" | "function", name: string, excludeId?: number) {
  const table = kind === "ministry" ? ministries : functions
  const [other] = await db
    .select({ id: table.id, isActive: table.isActive })
    .from(table)
    .where(and(sql`lower(${table.name}) = lower(${name.trim()})`, excludeId ? ne(table.id, excludeId) : undefined))
    .limit(1)
  if (!other) return
  const label = kind === "ministry" ? "ministério" : "função"
  throw new TRPCError({
    code: "CONFLICT",
    message: other.isActive
      ? `Já existe um ${label} com esse nome.`
      : `Já existe um ${label} desativado com esse nome. Reative-o em "Desativados" em vez de criar outro.`,
  })
}

export const ministryRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return await db
      .select({
        id: ministries.id,
        name: ministries.name,
        description: ministries.description,
      })
      .from(ministries)
      .where(eq(ministries.isActive, true))
      .orderBy(ministries.name);
  }),

  create: manageMinistries
    .input(ministrySchema)
    .mutation(async ({ input }) => {
      await assertUniqueName("ministry", input.name)
      const [newMinistry] = await db
        .insert(ministries)
        .values(input)
        .returning()
      return newMinistry
    }),

  update: manageMinistries
    .input(ministrySchema.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      await assertUniqueName("ministry", data.name, id)
      const [updatedMinistry] = await db
        .update(ministries)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(ministries.id, id))
        .returning()
      return updatedMinistry
    }),

  deactivate: manageMinistries
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deletedMinistry] = await db
        .update(ministries)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(ministries.id, input.id))
        .returning()
      return deletedMinistry
    }),

  listFunctions: protectedProcedure.query(async () => {
    return await db
      .select({
        id: functions.id,
        name: functions.name,
        description: functions.description,
        displayOrder: functions.displayOrder,
        // Onde a função é usada: serve para avisar o que muda ao desativar.
        ministryCount: sql<number>`(select count(*)::int from "ministry_functions" mf inner join "ministries" m on m.id = mf.ministry_id where mf.function_id = "functions"."id" and mf.is_active = true and m.is_active = true)`,
        memberCount: sql<number>`(select count(distinct mm.member_id)::int from "member_ministries" mm where mm.function_id = "functions"."id" and mm.is_active = true)`,
      })
      .from(functions)
      .where(eq(functions.isActive, true))
      .orderBy(functions.displayOrder, functions.name);
  }),

  /** Ministérios e funções desativados, para poder reativar. */
  listInactive: manageMinistries.query(async () => {
    const [inactiveMinistries, inactiveFunctions] = await Promise.all([
      db.select({ id: ministries.id, name: ministries.name }).from(ministries).where(eq(ministries.isActive, false)).orderBy(asc(ministries.name)),
      db.select({ id: functions.id, name: functions.name }).from(functions).where(eq(functions.isActive, false)).orderBy(asc(functions.name)),
    ])
    return { ministries: inactiveMinistries, functions: inactiveFunctions }
  }),

  reactivate: manageMinistries.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [row] = await db.update(ministries).set({ isActive: true, updatedAt: new Date() }).where(eq(ministries.id, input.id)).returning()
    return row
  }),

  reactivateFunction: manageMinistries.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [row] = await db.update(functions).set({ isActive: true, updatedAt: new Date() }).where(eq(functions.id, input.id)).returning()
    return row
  }),

  createFunction: manageMinistries
    .input(functionSchema)
    .mutation(async ({ input }) => {
      await assertUniqueName("function", input.name)
      const [newFunction] = await db
        .insert(functions)
        .values(input)
        .returning()
      return newFunction
    }),

  updateFunction: manageMinistries
    .input(functionSchema.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      await assertUniqueName("function", data.name, id)
      const [updatedFunction] = await db
        .update(functions)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(functions.id, id))
        .returning()
      return updatedFunction
    }),

  deactivateFunction: manageMinistries
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deletedFunction] = await db
        .update(functions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(functions.id, input.id))
        .returning()
      return deletedFunction
    }),

  getMinistryFunctions: protectedProcedure
    .input(z.object({ ministryId: z.number() }))
    .query(async ({ input }) => {
      return await db
        .select({
          id: ministryFunctions.id,
          ministryId: ministryFunctions.ministryId,
          functionId: ministryFunctions.functionId,
          functionName: functions.name,
          functionDescription: functions.description,
        })
        .from(ministryFunctions)
        .innerJoin(functions, eq(ministryFunctions.functionId, functions.id))
        .where(
          and(
            eq(ministryFunctions.ministryId, input.ministryId),
            eq(ministryFunctions.isActive, true),
            eq(functions.isActive, true)
          )
        )
        .orderBy(functions.name);
    }),

  addFunctionToMinistry: manageMinistries
    .input(ministryFunctionSchema)
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select({ id: ministryFunctions.id })
        .from(ministryFunctions)
        .where(
          and(
            eq(ministryFunctions.ministryId, input.ministryId),
            eq(ministryFunctions.functionId, input.functionId)
          )
        )
        .limit(1)

      if (existing) {
        const [reactivated] = await db
          .update(ministryFunctions)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(ministryFunctions.id, existing.id))
          .returning()
        return reactivated
      }

      const [newRelation] = await db
        .insert(ministryFunctions)
        .values(input)
        .returning()
      return newRelation
    }),

  listMinistryFunctions: protectedProcedure.query(async () => {
    return await db
      .select({
        ministryId: ministryFunctions.ministryId,
        functionId: ministryFunctions.functionId,
        functionName: functions.name,
      })
      .from(ministryFunctions)
      .innerJoin(functions, eq(ministryFunctions.functionId, functions.id))
      .where(
        and(
          eq(ministryFunctions.isActive, true),
          eq(functions.isActive, true)
        )
      );
  }),

  removeFunctionFromMinistry: manageMinistries
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [removedRelation] = await db
        .update(ministryFunctions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(ministryFunctions.id, input.id))
        .returning()
      if (removedRelation) {
        // Quem tinha essa função neste ministério continua no ministério, mas sem a função (e sem as permissões dela).
        await db
          .update(memberMinistries)
          .set({ functionId: null })
          .where(
            and(
              eq(memberMinistries.ministryId, removedRelation.ministryId),
              eq(memberMinistries.functionId, removedRelation.functionId),
              eq(memberMinistries.isActive, true),
            ),
          )
      }
      return removedRelation
    }),

  getAvailableFunctions: protectedProcedure
    .input(z.object({ ministryId: z.number() }))
    .query(async ({ input }) => {
      const currentFunctions = await db
        .select({ functionId: ministryFunctions.functionId })
        .from(ministryFunctions)
        .where(
          and(
            eq(ministryFunctions.ministryId, input.ministryId),
            eq(ministryFunctions.isActive, true)
          )
        )

      const currentFunctionIds = currentFunctions.map(f => f.functionId)

      return await db
        .select()
        .from(functions)
        .where(
          currentFunctionIds.length === 0
            ? eq(functions.isActive, true)
            : and(
                eq(functions.isActive, true),
                not(inArray(functions.id, currentFunctionIds))
              )
        )
        .orderBy(asc(functions.displayOrder), asc(functions.name))
    }),

  getMinistryStats: protectedProcedure.query(async () => {
    return await db
      .select({
        ministry: ministries,
        memberCount: countDistinct(members.id),
        functionCount: countDistinct(ministryFunctions.functionId),
      })
      .from(ministries)
      .leftJoin(memberMinistries,
        and(
          eq(memberMinistries.ministryId, ministries.id),
          eq(memberMinistries.isActive, true)
        )
      )
      .leftJoin(members,
        and(
          eq(members.id, memberMinistries.memberId),
          inArray(members.status, [...presentMemberStatuses])
        )
      )
      .leftJoin(ministryFunctions,
        and(
          eq(ministryFunctions.ministryId, ministries.id),
          eq(ministryFunctions.isActive, true)
        )
      )
      .where(eq(ministries.isActive, true))
      .groupBy(ministries.id)
      .orderBy(asc(ministries.name))
  }),

  getMinistryMembers: protectedProcedure
    .input(z.object({ ministryId: z.number() }))
    .query(async ({ input }) => {
      return await db
        .select({
          memberId: memberMinistries.memberId,
          firstName: members.firstName,
          lastName: members.lastName,
          functionName: functions.name,
          status: members.status,
        })
        .from(memberMinistries)
        .innerJoin(members, eq(memberMinistries.memberId, members.id))
        .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
        .where(
          and(
            eq(memberMinistries.ministryId, input.ministryId),
            eq(memberMinistries.isActive, true),
            inArray(members.status, [...presentMemberStatuses])
          )
        )
        .orderBy(asc(members.firstName), asc(members.lastName))
    }),
})

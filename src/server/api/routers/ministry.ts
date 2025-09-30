import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { ministries, functions, ministryFunctions, memberMinistries, members } from "@/server/db/schema"
import { eq, and, inArray, desc, asc, sql, not } from "drizzle-orm"
import { ministrySchema, functionSchema, ministryFunctionSchema } from "@/validators/ministry"

export const ministryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
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

  create: protectedProcedure
    .input(ministrySchema)
    .mutation(async ({ input }) => {
      const [newMinistry] = await db
        .insert(ministries)
        .values(input)
        .returning()
      return newMinistry
    }),

  update: protectedProcedure
    .input(ministrySchema.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
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

  delete: protectedProcedure
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

  getAllFunctions: protectedProcedure.query(async () => {
    return await db
      .select({
        id: functions.id,
        name: functions.name,
        description: functions.description,
        displayOrder: functions.displayOrder
      })
      .from(functions)
      .where(eq(functions.isActive, true))
      .orderBy(functions.displayOrder, functions.name);
  }),

  createFunction: protectedProcedure
    .input(functionSchema)
    .mutation(async ({ input }) => {
      const [newFunction] = await db
        .insert(functions)
        .values(input)
        .returning()
      return newFunction
    }),

  updateFunction: protectedProcedure
    .input(functionSchema.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
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

  deleteFunction: protectedProcedure
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
          ministryId: ministryFunctions.ministryId,
          functionId: ministryFunctions.functionId,
          functionName: functions.name,
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

  addFunctionToMinistry: protectedProcedure
    .input(ministryFunctionSchema)
    .mutation(async ({ input }) => {
      const [newRelation] = await db
        .insert(ministryFunctions)
        .values(input)
        .returning()
      return newRelation
    }),
    
  getAllMinistryFunctions: protectedProcedure.query(async () => {
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

  removeFunctionFromMinistry: protectedProcedure
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

    if (currentFunctionIds.length === 0) {
      return await db
        .select()
        .from(functions)
        .where(eq(functions.isActive, true))
        .orderBy(asc(functions.displayOrder), asc(functions.name))
    }

    // CORREÇÃO: Use not(inArray()) em vez da comparação booleana
    return await db
      .select()
      .from(functions)
      .where(
        and(
          eq(functions.isActive, true),
          not(inArray(functions.id, currentFunctionIds))
        )
      )
      .orderBy(asc(functions.displayOrder), asc(functions.name))
  }),
  
  // Estatísticas
  getMinistryStats: protectedProcedure.query(async () => {
    const ministriesWithCounts = await db
      .select({
        ministry: ministries,
        memberCount: sql<number>`COUNT(DISTINCT ${memberMinistries.memberId})`,
        functionCount: sql<number>`COUNT(DISTINCT ${ministryFunctions.functionId})`,
      })
      .from(ministries)
      .leftJoin(memberMinistries, 
        and(
          eq(memberMinistries.ministryId, ministries.id),
          eq(memberMinistries.isActive, true)
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

    return ministriesWithCounts
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
          eq(members.isActive, true)
        )
      )
      .orderBy(asc(members.firstName), asc(members.lastName))
  }),
})
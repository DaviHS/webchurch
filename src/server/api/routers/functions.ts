import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { functions } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export const functionsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await db
      .select()
      .from(functions)
      .where(eq(functions.isActive, true))
      .orderBy(functions.name)
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newFunction] = await db.insert(functions).values(input).returning()
      return newFunction
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      }),
    )
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

  delete: protectedProcedure
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
})

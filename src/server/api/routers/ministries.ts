import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { ministries } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export const ministriesRouter = createTRPCRouter({
  // Busca todos os ministérios ativos, ordenados por nome
  getAll: publicProcedure.query(async () => {
    return await db.select().from(ministries).where(eq(ministries.isActive, true)).orderBy(ministries.name)
  }),

  // Cria um novo ministério (autenticado)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newMinistry] = await db.insert(ministries).values(input).returning()
      return newMinistry
    }),

  // Atualiza um ministério existente (autenticado)
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

  // Soft delete: desativa um ministério (autenticado)
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
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
})

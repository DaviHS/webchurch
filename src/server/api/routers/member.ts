import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { members, memberMinistries, users } from "@/server/db/schema"
import { memberSchema } from "@/validators/member"
import { eq, and, isNotNull, isNull } from "drizzle-orm"
import { cleanEmptyStrings } from "@/lib/clean"

export const membersRouter = createTRPCRouter({
  create: protectedProcedure.input(memberSchema).mutation(async ({ input }) => {
    const { ministries, ...memberData } = input
    const cleanedData = cleanEmptyStrings(memberData)

    const [newMember] = await db.insert(members).values(cleanedData).returning()

    if (ministries?.length) {
      const memberMinistryData = ministries.map((ministry) => ({
        memberId: newMember!.id,
        ministryId: ministry.ministryId,
        role: ministry.role || null,
      }))

      await db.insert(memberMinistries).values(memberMinistryData)
    }

    return newMember
  }),

  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "visiting", "transferred"]).optional(),
        gender: z.enum(["male", "female"]).optional(),
        hasAccess: z.enum(["true", "false"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, search, status, gender, hasAccess } = input
      const offset = (page - 1) * limit

      const conditions = []

      if (status) conditions.push(eq(members.status, status))
      if (gender) conditions.push(eq(members.gender, gender))

      let baseQuery = db
        .select()
        .from(members)
        .leftJoin(users, eq(members.id, users.memberId))

      if (hasAccess === "true") {
        conditions.push(isNotNull(users.id))
      } else if (hasAccess === "false") {
        conditions.push(isNull(users.id))
      }

      const query = baseQuery.where(and(...conditions))

      const result = await query.limit(limit).offset(offset).execute()

      return result
    }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const member = await db.select().from(members).where(eq(members.id, input.id)).limit(1)

    if (!member[0]) throw new Error("Membro não encontrado")

    const memberMinistriesData = await db
      .select({
        ministryId: memberMinistries.ministryId,
        role: memberMinistries.role,
        joinedAt: memberMinistries.joinedAt,
        isActive: memberMinistries.isActive,
      })
      .from(memberMinistries)
      .where(and(eq(memberMinistries.memberId, input.id), eq(memberMinistries.isActive, true)))

    return {
      ...member[0],
      ministries: memberMinistriesData,
    }
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: memberSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { ministries, ...memberData } = input.data
      const cleanedData = cleanEmptyStrings(memberData)

      const [updatedMember] = await db
        .update(members)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning()

      if (ministries?.length) {
        await db
          .update(memberMinistries)
          .set({ isActive: false })
          .where(eq(memberMinistries.memberId, input.id))

        const memberMinistryData = ministries.map((ministry) => ({
          memberId: input.id,
          ministryId: ministry.ministryId,
          role: ministry.role || null,
        }))

        await db.insert(memberMinistries).values(memberMinistryData)
      }

      return updatedMember
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [deletedMember] = await db
      .update(members)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(members.id, input.id))
      .returning()

    return deletedMember
  }),
})

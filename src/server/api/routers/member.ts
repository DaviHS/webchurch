import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  members,
  memberMinistries,
  users,
  functions,
  ministries,
} from "@/server/db/schema";
import { memberSchema } from "@/validators/member";
import {
  eq,
  and,
  isNotNull,
  isNull,
  or,
  sql,
  inArray,
} from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";

export const membersRouter = createTRPCRouter({
  create: protectedProcedure.input(memberSchema).mutation(async ({ input }) => {
    const { ministries, ...memberData } = input;
    const cleanedData = cleanEmptyStrings(memberData);

    const [newMember] = await db.insert(members).values(cleanedData).returning();

    if (ministries?.length) {
      const memberMinistryData = ministries.map((ministry) => ({
        memberId: newMember!.id,
        ministryId: ministry.ministryId,
        functionId: ministry.functionId ?? null,
      }));

      await db.insert(memberMinistries).values(memberMinistryData);
    }

    return newMember;
  }),

  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "visiting", "transferred"]).optional(),
        gender: z.enum(["male", "female"]).optional(),
        hasAccess: z.enum(["true", "false"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, search, status, gender, hasAccess } = input;
      const offset = (page - 1) * limit;
      const conditions = [];

      if (status) conditions.push(eq(members.status, status));
      if (gender) conditions.push(eq(members.gender, gender));

      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${members.firstName}) LIKE ${searchLower}`,
            sql`LOWER(${members.lastName}) LIKE ${searchLower}`,
            sql`LOWER(${members.email}) LIKE ${searchLower}`
          )
        );
      }

      if (hasAccess === "true") {
        conditions.push(isNotNull(users.id));
      } else if (hasAccess === "false") {
        conditions.push(isNull(users.id));
      }

      let baseQuery = db.select().from(members).leftJoin(users, eq(members.id, users.memberId));

      const query = conditions.length ? baseQuery.where(and(...conditions)) : baseQuery;

      const result = await query.limit(limit).offset(offset).execute();

      if (result.length === 0) return [];

      const memberIds = result.map((r) => r.members.id);

// Substitua este trecho dentro do método getAll:

const ministriesData = await db
  .select({
    memberId: memberMinistries.memberId,
    ministryName: ministries.name,
    functionName: functions.name,
  })
  .from(memberMinistries)
  .leftJoin(ministries, eq(memberMinistries.ministryId, ministries.id))
  .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
  .where(
    and(
      inArray(memberMinistries.memberId, memberIds), // Corrigido aqui
      eq(memberMinistries.isActive, true),
    ),
  )
  .execute()

const ministriesByMember = ministriesData.reduce((acc, cur) => {
  if (typeof cur.memberId !== "number") {
    // Se não tem memberId válido, simplesmente ignora esse registro
    return acc;
  }

  if (!acc[cur.memberId]) acc[cur.memberId] = [];

  acc[cur!.memberId].push({
    ministryName: cur.ministryName ?? "",
    functionName: cur.functionName,
  });

  return acc;
}, {} as Record<number, { ministryName: string; functionName: string | null }[]>);


return result.map((r) => ({
  ...r,
  ministries: ministriesByMember[r.members?.id ?? 0] || [], // evita undefined
}))
;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const member = await db.select().from(members).where(eq(members.id, input.id)).limit(1);

      if (!member[0]) throw new Error("Membro não encontrado");

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
        .leftJoin(ministries, eq(memberMinistries.ministryId, ministries.id))
        .leftJoin(functions, eq(memberMinistries.functionId, functions.id))
        .where(
          and(
            eq(memberMinistries.memberId, input.id),
            eq(memberMinistries.isActive, true)
          )
        )
        .execute();

      return {
        ...member[0],
        ministries: memberMinistriesData,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: memberSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { ministries, ...memberData } = input.data;
      const cleanedData = cleanEmptyStrings(memberData);

      const [updatedMember] = await db
        .update(members)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      if (ministries?.length) {
        await db
          .update(memberMinistries)
          .set({ isActive: false })
          .where(eq(memberMinistries.memberId, input.id));

        const memberMinistryData = ministries.map((ministry) => ({
          memberId: input.id,
          ministryId: ministry.ministryId,
          functionId: ministry.functionId ?? null,
        }));

        await db.insert(memberMinistries).values(memberMinistryData);
      }

      return updatedMember;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deletedMember] = await db
        .update(members)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      return deletedMember;
    }),
});

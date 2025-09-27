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
  asc,
} from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";

export const memberRouter = createTRPCRouter({
  create: protectedProcedure.input(memberSchema).mutation(async ({ input }) => {
    const { ministries: ministriesInput, ...memberData } = input;
    const cleanedData = cleanEmptyStrings(memberData);

    console.log('input', input)
    console.log('cleanedData', cleanedData)

    const result = await db.insert(members).values(cleanedData).returning();

    if (!result || result.length === 0) {
      throw new Error("Falha ao criar membro");
    }

    const newMember = result[0];

    if (ministriesInput && ministriesInput.length > 0) {
      const memberMinistryData = ministriesInput.map((ministry) => ({
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
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional().nullable(),
        status: z.enum(["active", "inactive", "visiting", "transferred"]).optional().nullable(),
        gender: z.enum(["male", "female"]).optional().nullable(),
        hasAccess: z.enum(["true", "false"]).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, search, status, gender, hasAccess } = input;
      const offset = (page - 1) * limit;
      
      const baseConditions = [eq(members.isActive, true)];

      const optionalConditions = [];

      if (status) {
        optionalConditions.push(eq(members.status, status));
      }
      
      if (gender) {
        optionalConditions.push(eq(members.gender, gender));
      }

      if (search && search.trim() !== '') {
        const searchLower = `%${search.toLowerCase()}%`;
        const searchConditions = or(
          sql`LOWER(${members.firstName}) LIKE ${searchLower}`,
          sql`LOWER(${members.lastName}) LIKE ${searchLower}`,
          sql`LOWER(${members.email}) LIKE ${searchLower}`
        );
        optionalConditions.push(searchConditions);
      }

      if (hasAccess === "true") {
        optionalConditions.push(isNotNull(users.id));
      } else if (hasAccess === "false") {
        optionalConditions.push(isNull(users.id));
      }

      const allConditions = optionalConditions.length > 0 
        ? and(...baseConditions, ...optionalConditions)
        : and(...baseConditions);

      const result = await db
        .select({
          member: members,
          user: users,
        })
        .from(members)
        .leftJoin(users, eq(members.id, users.memberId))
        .where(allConditions) 
        .orderBy(asc(members.firstName), asc(members.lastName))
        .limit(limit)
        .offset(offset);

      if (result.length === 0) return [];

      const memberIds = result.map(r => r.member.id);

      const ministriesData = await db
        .select({
          memberId: memberMinistries.memberId,
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

      const ministriesByMember: Record<number, { ministryName: string; functionName: string | null }[]> = {};
      
      ministriesData.forEach((cur) => {
        if (cur.memberId) {
          if (!ministriesByMember[cur.memberId]) {
            ministriesByMember[cur.memberId] = [];
          }
          ministriesByMember[cur.memberId!]!.push({
            ministryName: cur.ministryName || "Ministério sem nome",
            functionName: cur.functionName,
          });
        }
      });

      // Formatar resposta final
      return result.map(r => ({
        members: {
          ...r.member,
          ministries: ministriesByMember[r.member.id] || [],
        },
        users: r.user,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.id, input.id))
        .limit(1);

      if (!member) throw new Error("Membro não encontrado");

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

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: memberSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { ministries: ministriesInput, ...memberData } = input.data;
      const cleanedData = cleanEmptyStrings(memberData);

      // Atualizar membro
      const result = await db
        .update(members)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Falha ao atualizar membro");
      }

      const updatedMember = result[0];

      // Atualizar ministérios se fornecidos
      if (ministriesInput) {
        // Desativar relações antigas
        await db
          .update(memberMinistries)
          .set({ isActive: false })
          .where(eq(memberMinistries.memberId, input.id));

        // Criar novas relações se houver ministérios
        if (ministriesInput.length > 0) {
          const memberMinistryData = ministriesInput.map((ministry) => ({
            memberId: input.id,
            ministryId: ministry.ministryId,
            functionId: ministry.functionId ?? null,
          }));

          await db.insert(memberMinistries).values(memberMinistryData);
        }
      }

      return updatedMember;
    }),

  // CORREÇÃO: Soft delete (desativar membro)
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await db
        .update(members)
        .set({
          isActive: false,
          status: "inactive", // Muda o status para inativo
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Falha ao desativar membro");
      }

      return result[0];
    }),

  // Para compatibilidade, manter delete como alias de deactivate
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await db
        .update(members)
        .set({
          isActive: false,
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(members.id, input.id))
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Falha ao excluir membro");
      }

      return result[0];
    }),
});
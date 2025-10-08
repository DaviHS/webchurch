import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import { z } from "zod"
import { db } from "@/server/db"
import { users, members } from "@/server/db/schema"
import { compare, hash } from "bcrypt-ts"
import { eq, asc, sql } from "drizzle-orm"
import { userCreateSchema, userUpdateSchema } from "@/validators/user"

export const userRouter = createTRPCRouter({
  // Criar novo usuário
  create: publicProcedure
    .input(userCreateSchema)
    .mutation(async ({ input }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))

      if (existing.length > 0) {
        throw new Error("Já existe um usuário com esse e-mail.")
      }

      const passwordHash = await hash(input.password, 10)

      const [newUser] = await db
        .insert(users)
        .values({
          memberId: input.memberId,
          email: input.email,
          passwordHash,
          status: "pending", // Status padrão como pending
        })
        .returning()

      return newUser
    }),

  // Buscar todos os usuários
  getAll: protectedProcedure.query(async () => {
    return await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
        status: users.status,
        memberId: users.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
  }),

  // Buscar um usuário por ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
        status: users.status, // Usando status
        memberId: users.memberId,
      })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1)

    if (!user) throw new Error("Usuário não encontrado")

    return user
  }),
  
  getByMemberId: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.memberId, input.memberId))
        .limit(1);

      return user || null;
    }),

  update: protectedProcedure
    .input(userUpdateSchema.extend({
      status: z.enum(["pending", "active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, password, ...rest } = input

      const dataToUpdate: Partial<typeof users.$inferInsert> = {
        ...rest,
        updatedAt: new Date(),
      }

      if (password) {
        dataToUpdate.passwordHash = await hash(password, 10)
      }

      const [updatedUser] = await db
        .update(users)
        .set(dataToUpdate)
        .where(eq(users.id, id))
        .returning()

      return updatedUser
    }),

  // "Deletar" usuário - agora usando status
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [deletedUser] = await db
      .update(users)
      .set({
        status: "inactive", // Usando status em vez de isActive
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.id))
      .returning()

    return deletedUser
  }),

  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          status: "active",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning();

      if (!updatedUser) {
        throw new Error("Falha ao aprovar usuário");
      }

      return updatedUser;
    }),

  // Rejeitar usuário
  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning();

      if (!updatedUser) {
        throw new Error("Falha ao rejeitar usuário");
      }

      return updatedUser;
    }),

  // Buscar usuários pendentes
  getPending: protectedProcedure.query(async () => {
    return await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
        status: users.status,
        approvedAt: users.approvedAt,
        createdAt: users.createdAt,
        memberId: users.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(eq(users.status, "pending"))
      .orderBy(asc(users.createdAt));
  }),

  // Contar usuários pendentes (para o badge)
  getPendingCount: protectedProcedure.query(async () => {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, "pending"));
    
    return result?.count || 0;
  }),
  changePassword: protectedProcedure
  .input(z.object({
    newPassword: z.string().min(6),
  }))
  .mutation(async ({ input, ctx }) => {
    const { newPassword } = input;
    const userId = ctx.session.user.id;

    // Buscar o usuário atual
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId!)))
      .then((res) => res[0]);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a senha atual é a padrão (123456)
    const isDefaultPassword = await compare("123456", user.passwordHash);
    
    if (!isDefaultPassword) {
      throw new Error("Esta funcionalidade é apenas para usuários com senha padrão");
    }

    // Criptografar a nova senha
    const newPasswordHash = await hash(newPassword, 10);

    // Atualizar a senha
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordUpdatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(userId!)))
      .returning();

    return updatedUser;
  }),
})
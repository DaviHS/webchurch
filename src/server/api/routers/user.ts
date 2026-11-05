import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@/server/db"
import { users, members } from "@/server/db/schema"
import { compare, hash } from "bcrypt-ts"
import { eq, asc, count } from "drizzle-orm"
import { userCreateSchema, userUpdateSchema } from "@/validators/user"
import { DEFAULT_PASSWORD } from "@/lib/default-password"

const manageUsers = can("users.manage")

const safeUserColumns = {
  id: users.id,
  memberId: users.memberId,
  email: users.email,
  isAdmin: users.isAdmin,
  status: users.status,
  approvedAt: users.approvedAt,
  lastLogin: users.lastLogin,
  passwordCreatedAt: users.passwordCreatedAt,
  passwordUpdatedAt: users.passwordUpdatedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

export const userRouter = createTRPCRouter({
  create: manageUsers
    .input(userCreateSchema)
    .mutation(async ({ input }) => {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um usuário com esse e-mail." })
      }

      const passwordHash = await hash(input.password, 10)
      const now = new Date()

      const [newUser] = await db
        .insert(users)
        .values({
          memberId: input.memberId,
          email: input.email,
          passwordHash,
          passwordCreatedAt: now,
          status: "pending",
        })
        .returning(safeUserColumns)

      return newUser
    }),

  list: manageUsers.query(async () => {
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

  getById: manageUsers.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
        status: users.status,
        memberId: users.memberId,
      })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1)

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })

    return user
  }),

  getByMemberId: manageUsers
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select(safeUserColumns)
        .from(users)
        .where(eq(users.memberId, input.memberId))
        .limit(1);

      return user ?? null;
    }),

  update: manageUsers
    .input(userUpdateSchema.extend({
      status: z.enum(["pending", "active", "inactive"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, password, ...rest } = input
      const now = new Date()

      if (rest.isAdmin !== undefined) {
        if (!ctx.access.isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem alterar o perfil de administrador." })
        }
        if (Number(ctx.session.user.id) === id && !rest.isAdmin) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover o seu próprio acesso de administrador." })
        }
      }

      const dataToUpdate: Partial<typeof users.$inferInsert> = {
        ...rest,
        updatedAt: now,
      }

      if (password) {
        dataToUpdate.passwordHash = await hash(password, 10)
        dataToUpdate.passwordUpdatedAt = now
      }

      const [updatedUser] = await db
        .update(users)
        .set(dataToUpdate)
        .where(eq(users.id, id))
        .returning(safeUserColumns)

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
      }

      return updatedUser
    }),

  deactivate: manageUsers.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [deletedUser] = await db
      .update(users)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.id))
      .returning(safeUserColumns)

    return deletedUser
  }),

  approve: manageUsers
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
        .returning(safeUserColumns);

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Falha ao aprovar usuário" });
      }

      return updatedUser;
    }),

  reject: manageUsers
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning(safeUserColumns);

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Falha ao rejeitar usuário" });
      }

      return updatedUser;
    }),

  getPending: manageUsers.query(async () => {
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

  getPendingCount: manageUsers.query(async () => {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "pending"));

    return result?.count ?? 0;
  }),

  changePassword: protectedProcedure
    .input(z.object({
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const { newPassword } = input;
      const userId = Number(ctx.session.user.id);

      if (!Number.isInteger(userId)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const isDefaultPassword = await compare(DEFAULT_PASSWORD, user.passwordHash);

      if (!isDefaultPassword) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta funcionalidade é apenas para usuários com senha padrão" });
      }

      if (newPassword === DEFAULT_PASSWORD) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A nova senha deve ser diferente da senha padrão" });
      }

      const now = new Date();
      const [updatedUser] = await db
        .update(users)
        .set({
          passwordHash: await hash(newPassword, 10),
          passwordUpdatedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
        .returning(safeUserColumns);

      return updatedUser;
    }),
})

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { z } from "zod"
import { db } from "@/server/db"
import { users, members } from "@/server/db/schema"
import { hash } from "bcrypt-ts"
import { eq } from "drizzle-orm"
import { userCreateSchema, userUpdateSchema } from "@/validators/user"

export const userRouter = createTRPCRouter({
  // Criar novo usuário
  create: protectedProcedure
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
        isActive: users.isActive,
        memberId: users.memberId,
        fullName: members.firstName,
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
        isActive: users.isActive,
        memberId: users.memberId,
      })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1)

    if (!user) throw new Error("Usuário não encontrado")

    return user
  }),

  // Atualizar usuário
  update: protectedProcedure
    .input(userUpdateSchema)
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

  // "Deletar" usuário (soft delete)
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [deletedUser] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.id))
      .returning()

    return deletedUser
  }),
})

import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@/server/db"
import { users, members, memberMinistries, ministries, ministryFunctions } from "@/server/db/schema"
import { randomBytes, createHash } from "node:crypto"
import { compare, hash } from "bcrypt-ts"
import { and, asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm"
import { userCreateSchema, userUpdateSchema } from "@/validators/user"
import { DEFAULT_PASSWORD } from "@/lib/default-password"
import { escapeHtml, sendEmail } from "@/server/email"

const manageUsers = can("users.manage")

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

function approvalEmail(name: string | null, link: string | null) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";
  const lines = [
    greeting,
    "",
    "O seu acesso ao sistema da Igreja Central - Vida com Propósito foi aprovado.",
    link ? `Para entrar, acesse: ${link}` : "Você já pode entrar no sistema com o seu e-mail e a sua senha.",
  ];
  const safeLink = link ? escapeHtml(link) : null;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
<p>${escapeHtml(greeting)}</p>
<p>O seu acesso ao sistema da <strong>Igreja Central - Vida com Propósito</strong> foi aprovado.</p>
${safeLink ? `<p><a href="${safeLink}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Entrar no sistema</a></p>` : "<p>Você já pode entrar com o seu e-mail e a sua senha.</p>"}
</div>`;
  return { subject: "Seu acesso foi aprovado", text: lines.join("\n"), html };
}

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

      const passwordHash = await hash(input.password ?? randomBytes(24).toString("base64url"), 10)
      const now = new Date()

      const [newUser] = await db
        .insert(users)
        .values({
          memberId: input.memberId,
          email: input.email,
          passwordHash,
          passwordCreatedAt: now,
          status: "active",
          approvedAt: now,
        })
        .returning(safeUserColumns)

      return newUser
    }),

  inviteLink: manageUsers
    .input(z.object({ userId: z.number(), origin: z.string().url().max(200).optional() }))
    .mutation(async ({ input }) => {
      const [user] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, input.userId)).limit(1)
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
      if (user.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O acesso precisa estar ativo para gerar o link. Ative ou aprove primeiro." })
      }

      const base = ((process.env.NEXT_PUBLIC_APP_URL?.trim() ? process.env.NEXT_PUBLIC_APP_URL.trim() : (input.origin ?? ""))).replace(/\/+$/, "")
      if (!base) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Endereço do sistema não configurado." })

      const token = randomBytes(32).toString("base64url")
      const expires = new Date(Date.now() + INVITE_TTL_MS)
      await db
        .update(users)
        .set({ resetToken: hashToken(token), resetTokenExpires: expires, updatedAt: new Date() })
        .where(eq(users.id, user.id))

      return { url: `${base}/reset-password?token=${token}`, expiresAt: expires }
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
    .input(z.object({ id: z.number(), ministryId: z.number().optional(), functionId: z.number().optional() }))
    .mutation(async ({ input }) => {
      if (input.ministryId !== undefined) {
        const [ministry] = await db.select({ id: ministries.id }).from(ministries).where(and(eq(ministries.id, input.ministryId), eq(ministries.isActive, true))).limit(1)
        if (!ministry) throw new TRPCError({ code: "BAD_REQUEST", message: "Ministério não encontrado ou inativo." })
        if (input.functionId !== undefined) {
          const [link] = await db
            .select({ id: ministryFunctions.id })
            .from(ministryFunctions)
            .where(and(eq(ministryFunctions.ministryId, input.ministryId), eq(ministryFunctions.functionId, input.functionId), eq(ministryFunctions.isActive, true)))
            .limit(1)
          if (!link) throw new TRPCError({ code: "BAD_REQUEST", message: "Essa função não pertence ao ministério escolhido." })
        }
      }

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

      if (input.ministryId !== undefined && updatedUser.memberId) {
        const [already] = await db
          .select({ id: memberMinistries.id })
          .from(memberMinistries)
          .where(and(eq(memberMinistries.memberId, updatedUser.memberId), eq(memberMinistries.ministryId, input.ministryId), eq(memberMinistries.isActive, true)))
          .limit(1)
        if (!already) {
          await db.insert(memberMinistries).values({ memberId: updatedUser.memberId, ministryId: input.ministryId, functionId: input.functionId })
        }
      }

      const [member] = updatedUser.memberId
        ? await db.select({ firstName: members.firstName }).from(members).where(eq(members.id, updatedUser.memberId)).limit(1)
        : [];
      const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
      const emailSent = await sendEmail({
        to: updatedUser.email,
        ...approvalEmail(member?.firstName ?? null, base ? `${base}/sign-in` : null),
      });

      return { ...updatedUser, emailSent };
    }),

  reject: manageUsers
    .input(z.object({ id: z.number(), reason: z.string().trim().max(200).optional() }))
    .mutation(async ({ input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          status: "inactive",
          approvedAt: null,
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
    const rows = await db
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
        whatsapp: members.whatsapp,
        birthDate: members.birthDate,
        city: members.city,
        state: members.state,
        baptismDate: members.baptismDate,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(eq(users.status, "pending"))
      .orderBy(asc(users.createdAt));

    return await Promise.all(
      rows.map(async (row) => {
        if (!row.memberId || !row.firstName || !row.lastName) return { ...row, duplicates: [] as { id: number; name: string; reason: string }[] }
        const phoneDigits = (row.phone ?? "").replace(/\D/g, "")
        const matches = [
          sql`unaccent(lower(${members.firstName} || ' ' || ${members.lastName})) = unaccent(lower(${`${row.firstName} ${row.lastName}`}))`,
          ...(phoneDigits.length >= 10 ? [sql`regexp_replace(coalesce(${members.phone}, ''), '\\D', '', 'g') = ${phoneDigits}`] : []),
        ]
        const found = await db
          .select({ id: members.id, firstName: members.firstName, lastName: members.lastName, phone: members.phone })
          .from(members)
          .where(and(or(...matches), ne(members.id, row.memberId)))
          .limit(3)
        return {
          ...row,
          duplicates: found.map((item) => ({
            id: item.id,
            name: `${item.firstName} ${item.lastName}`,
            reason: phoneDigits.length >= 10 && (item.phone ?? "").replace(/\D/g, "") === phoneDigits ? "mesmo telefone" : "mesmo nome",
          })),
        }
      }),
    )
  }),

  getRejected: manageUsers.query(async () => {
    return await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(and(eq(users.status, "inactive"), isNull(users.approvedAt)))
      .orderBy(desc(users.updatedAt))
  }),

  reconsider: manageUsers.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [updatedUser] = await db
      .update(users)
      .set({ status: "pending", updatedAt: new Date() })
      .where(and(eq(users.id, input.id), eq(users.status, "inactive"), isNull(users.approvedAt)))
      .returning(safeUserColumns)
    if (!updatedUser) throw new TRPCError({ code: "NOT_FOUND", message: "Essa solicitação não está mais rejeitada." })
    return updatedUser
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

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { members, users } from "@/server/db/schema";
import { registerSchema } from "@/validators/register";
import { hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";

export const registerRouter = createTRPCRouter({
  create: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { password, confirmPassword, phoneIsWhatsapp, ...memberData } = input;

      const [existingMember] = await db.select({ id: members.id }).from(members).where(eq(members.email, memberData.email)).limit(1);
      if (existingMember) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um membro com este e-mail." });
      }

      const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, memberData.email)).limit(1);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um usuário com este e-mail." });
      }

      // O hash fica pronto antes de gravar qualquer coisa, para não deixar o cadastro pela metade se ele falhar.
      const passwordHash = await hash(password, 10);
      const cleanedData = cleanEmptyStrings(memberData);

      const [newMember] = await db
        .insert(members)
        .values({
          ...cleanedData,
          whatsapp: phoneIsWhatsapp ? memberData.phone : undefined,
          status: "active",
          isActive: true,
        })
        .returning();

      if (!newMember) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível concluir o cadastro. Tente novamente." });
      }

      try {
        const [newUser] = await db
          .insert(users)
          .values({
            memberId: newMember.id,
            email: memberData.email,
            passwordHash,
            passwordCreatedAt: new Date(),
            status: "pending",
            isAdmin: false,
          })
          .returning({ id: users.id, email: users.email, status: users.status });

        if (!newUser) throw new Error("A conta não foi criada");

        return {
          member: newMember,
          user: newUser,
          message: "Cadastro enviado. A liderança vai analisar e liberar o seu acesso.",
        };
      } catch (error) {
        // Se a conta não foi criada (e-mail repetido na mesma hora, falha do banco...), não deixa o membro sozinho no cadastro.
        await db.delete(members).where(eq(members.id, newMember.id));
        const duplicated = error instanceof Error && /unique|duplicate/i.test(error.message);
        throw new TRPCError({
          code: duplicated ? "CONFLICT" : "INTERNAL_SERVER_ERROR",
          message: duplicated ? "Já existe um usuário com este e-mail." : "Não foi possível concluir o cadastro. Tente novamente.",
        });
      }
    }),
});

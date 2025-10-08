import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { members, users } from "@/server/db/schema";
import { registerSchema } from "@/validators/register";
import { hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";

export const registerRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { password, confirmPassword, ...memberData } = input;

      // Verificar se email já existe
      const existingMember = await db
        .select()
        .from(members)
        .where(eq(members.email, memberData.email))
        .limit(1);

      if (existingMember.length > 0) {
        throw new Error("Já existe um membro com este email");
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, memberData.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Já existe um usuário com este email");
      }

      // Limpar dados vazios
      const cleanedData = cleanEmptyStrings(memberData);

      // Criar member
      const [newMember] = await db
        .insert(members)
        .values({
          ...cleanedData,
          status: "active",
          isActive: true,
        })
        .returning();

      if (!newMember) {
        throw new Error("Falha ao criar membro");
      }

      // Criar user com status pending
      const passwordHash = await hash(password, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          memberId: newMember.id,
          email: memberData.email,
          passwordHash,
          status: "pending", // Status de aprovação pendente
          isAdmin: false,
        })
        .returning();

      if (!newUser) {
        // Rollback: remover member se user falhar
        await db.delete(members).where(eq(members.id, newMember.id));
        throw new Error("Falha ao criar usuário");
      }

      return {
        member: newMember,
        user: newUser,
        message: "Registro realizado com sucesso! Aguarde a aprovação do seu cadastro."
      };
    }),
});
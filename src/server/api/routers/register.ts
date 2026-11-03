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
      const { password, confirmPassword, ...memberData } = input;

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

      const cleanedData = cleanEmptyStrings(memberData);

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

      const passwordHash = await hash(password, 10);
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

      if (!newUser) {
        await db.delete(members).where(eq(members.id, newMember.id));
        throw new Error("Falha ao criar usuário");
      }

      return {
        member: newMember,
        user: newUser,
        message: "Cadastro realizado com sucesso. Aguarde a aprovação."
      };
    }),
});
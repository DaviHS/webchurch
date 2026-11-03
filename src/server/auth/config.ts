import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, members } from "../db/schema";
import { signInSchema } from "@/validators/auth";
import { compare } from "bcrypt-ts";
import Credentials from "next-auth/providers/credentials";
import { type NextAuthConfig } from "next-auth";
import { env } from "@/env";
import { DEFAULT_PASSWORD } from "@/lib/default-password";

class InvalidLoginError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const authConfig: NextAuthConfig = {
  secret: env.AUTH_SECRET,
  pages: {
    signOut: `/sign-in`,
    signIn: `/sign-in`,
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials) throw new InvalidLoginError("MISSING_CREDENTIALS", "Necessário informar as credenciais!");

        const { email, password } = await signInSchema.parseAsync(credentials);

        const [user] = await db
          .select({
            userId: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            memberId: users.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            status: users.status,
            isAdmin: users.isAdmin,
          })
          .from(users)
          .leftJoin(members, eq(users.memberId, members.id))
          .where(eq(users.email, email))
          .limit(1);

        if (!user) throw new InvalidLoginError("USER_NOT_FOUND", "Usuário não encontrado");

        if (user.status === "pending") {
          throw new InvalidLoginError("PENDING", "Seu cadastro está pendente de aprovação. Aguarde a liberação do acesso.");
        }

        if (user.status !== "active") {
          throw new InvalidLoginError("INACTIVE", "Seu cadastro não está ativo. Entre em contato com o suporte.");
        }

        const passwordOk = await compare(password, user.passwordHash);

        if (!passwordOk) throw new InvalidLoginError("INVALID_CREDENTIALS", "Senha incorreta");

        if (!user.email) {
          throw new InvalidLoginError("NO_EMAIL", "Usuário sem e-mail cadastrado.");
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

        const isDefaultPassword = await compare(DEFAULT_PASSWORD, user.passwordHash);

        return {
          id: user.userId.toString(),
          userId: user.userId,
          email: user.email,
          name: fullName,
          memberId: user.memberId,
          hasDefaultPassword: isDefaultPassword,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update" && token.userId) {
        const [current] = await db
          .select({ passwordHash: users.passwordHash, isAdmin: users.isAdmin })
          .from(users)
          .where(eq(users.id, token.userId))
          .limit(1);
        if (current) {
          token.hasDefaultPassword = await compare(DEFAULT_PASSWORD, current.passwordHash);
          token.isAdmin = current.isAdmin;
        }
      }

      if (user) {
        token.userId = user.userId;
        token.email = user.email;
        token.name = user.name;
        token.memberId = user.memberId;
        token.sub = user.id;
        token.hasDefaultPassword = user.hasDefaultPassword;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.userId = token.userId;
      session.user.email = token.email ?? session.user.email;
      session.user.name = token.name;
      session.user.memberId = token.memberId;
      session.user.hasDefaultPassword = token.hasDefaultPassword;
      session.user.isAdmin = token.isAdmin ?? false;
      return session;
    },
  },
};

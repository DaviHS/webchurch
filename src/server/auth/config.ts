import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, members } from "../db/schema";
import { signInSchema } from "@/validators/auth";
import { compare } from "bcrypt-ts";
import Credentials from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";
import { env } from "@/env";

class InvalidLoginError extends Error {
  code = "Invalid identifier or password";

  constructor(message: string) {
    super(message);
    this.code = message;
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
        if (!credentials) throw new Error("Necessário informar as credenciais!");

        const { email, password } = await signInSchema.parseAsync(credentials);

        const [user] = await db
          .select({
            userId: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            memberId: users.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
          })
          .from(users)
          .leftJoin(members, eq(users.memberId, members.id))
          .where(eq(users.email, email))
          .limit(1);

        if (!user) throw new InvalidLoginError("Usuário não encontrado");

        const passwordOk = await compare(password, user.passwordHash);

        if (!passwordOk) throw new InvalidLoginError("Senha incorreta");

        if (!user.email) {
          throw new InvalidLoginError("Usuário sem e-mail cadastrado.");
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

        return {
          userId: user.userId,
          email: user.email,
          name: fullName,
          memberId: user.memberId,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.userId = user.userId;
        token.email = user.email;
        token.name = user.name;
        token.memberId = user.memberId;
        token.sub = String(user.userId); // sempre string
      }
      return token;
    },

    session({ session, token }: { session: any; token: any }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? "", // id deve ser string
          userId: token.userId,
          email: token.email,
          name: token.name,
          memberId: token.memberId,
        },
      };
    },
  },
};

import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  type User,
  type DefaultSession,
  type NextAuthConfig,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type JWT } from "next-auth/jwt";

import { env } from "@/env";
import { db } from "@/lib/prisma"; // ou "@/server/db", dependendo da sua estrutura

// Classes de erro personalizadas
class InvalidLoginError extends Error {
  code = "Invalid identifier or password";

  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

class AuthorizationLoginError extends Error {
  code = "O usuário não tem permissão pra acessar o aplicativo!";

  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

// Extensão de tipos para JWT
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// Extensão de tipos para sessão e usuário
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

// Configuração do NextAuth
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "admin@igrejacentral.com" &&
          credentials?.password === "senha123"
        ) {
          return {
            id: "admin-id",
            name: "Administrador",
            email: "admin@igrejacentral.com",
            role: "admin",
          };
        }

        // Exemplo de como lançar erro personalizado
        throw new InvalidLoginError("Email ou senha incorretos.");
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.id = session.user.id;
        token.role = session.user.role;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        },
      };
    },
  },
} satisfies NextAuthConfig;

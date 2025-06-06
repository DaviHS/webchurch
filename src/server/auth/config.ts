import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/prisma";
import { env } from "@/env";
import type { DefaultSession, NextAuthOptions } from "next-auth";

// Classes de erro personalizadas
class InvalidLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLoginError";
  }
}

class AuthorizationLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationLoginError";
  }
}

// Extensão de tipos
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
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

        throw new InvalidLoginError("Email ou senha incorretos.");
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
};
import {
  type User,
  type DefaultSession,
  type NextAuthConfig,
  CredentialsSignin,
} from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { type JWT } from "next-auth/jwt";

import { api } from "@/lib/api";
import type { ResponseAPI, UserAPI } from "@/types";
import { signInSchema } from "@/validators/auth";
import { z } from "zod";
import axios from "axios";

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid identifier or password";

  constructor(message: string) {
    super(message);

    this.code = message;
  }
}

class AuthorizationLoginError extends CredentialsSignin {
  code = "O usuário não tem permissão pra acessar o aplicativo!";

  constructor(message: string) {
    super(message);

    this.code = message;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: number;
    name: string;
    role: string;
    email: string,
  }
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    userId: number;
    name: string;
    role: string;
    email: string,
    // ...other properties
    // role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  pages: {
    signOut: `/sign-in`,
    signIn: `/app`,
  },
  trustHost: true,
  session: { 
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [
    Credentials({
      credentials: {
        userLogin: {},
        password: {},
      },
      async authorize(credentials) {
        console.log("[authorize]: ", credentials);
        if (!credentials)
          throw new Error("Necessário informar as credenciais!");

        const { userLogin, password, auth_type } = await signInSchema
          .extend({
            auth_type: z.enum(["re_auth", "email_auth", "facial_auth"]),
            app_id: z.string()
          })
          .parseAsync(credentials);

        try {
          const response = await api.post<ResponseAPI<UserAPI>>("/auth/login", {
            userLogin,
            password,
          });

          console.log("[LOGIN RES STATUS]:", response.status);
          console.log("[LOGIN RES DATA]:", response.data);

          if (response.data.error)
            throw new InvalidLoginError(response.data.message);

          const { data } = response.data;

          const user: User = {
            userId: data.userId,
            name: data.name,
            email: data.email,
            role: data.role
          };

          return user;
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error("[LOGIN ERROR - AXIOS]:", err.response?.status, await err.response?.data);
          } else {
            console.error("[LOGIN ERROR - GENERIC]:", err);
          }
          throw err;
        }
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token = {
          ...token,
          ...session,
        } as JWT;
      }

      // console.log("[token:1]: ", token);

      if (user) {
        token = {
          ...token,
          ...user,
        };
      }
      return token;
    },
    session: ({ session, token }) => {
      // console.log("[token:2]: ", token);

      return {
        ...session,
        user: {
          ...session.user,
          userId: token.userId,
          name: token.name,
          email: token.email,
          role: token.role,
          id: token.sub,
        },
      };
    },
  },
} satisfies NextAuthConfig;

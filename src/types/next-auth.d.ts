import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    userId?: number;
    memberId?: number | null;
    hasDefaultPassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      userId?: number;
      email?: string | null;
      name?: string | null;
      memberId?: number | null;
      hasDefaultPassword?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number;
    memberId?: number | null;
    hasDefaultPassword?: boolean;
  }
}
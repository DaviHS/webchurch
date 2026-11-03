import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    userId?: number;
    memberId?: number | null;
    hasDefaultPassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      userId?: number;
      memberId?: number | null;
      hasDefaultPassword?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: number;
    memberId?: number | null;
    hasDefaultPassword?: boolean;
  }
}

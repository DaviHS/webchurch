import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { loadAccess } from "@/server/access";
import { db } from "@/server/db";
import { functionPermissions, functions } from "@/server/db/schema";
import { isPermission, type Permission } from "@/lib/permissions";

const manageUsers = can("users.manage");

export const accessRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const access = await loadAccess(Number(ctx.session.user.id));
    return { isAdmin: access.isAdmin, permissions: [...access.permissions] };
  }),

  listFunctionPermissions: manageUsers.query(async () => {
    const rows = await db.select().from(functionPermissions);
    const byFunction: Record<number, Permission[]> = {};
    for (const row of rows) {
      if (isPermission(row.permission)) (byFunction[row.functionId] ??= []).push(row.permission);
    }
    return byFunction;
  }),

  setFunctionPermissions: manageUsers
    .input(
      z.object({
        functionId: z.number(),
        permissions: z.array(z.string().refine(isPermission, "Permissão inválida")),
      }),
    )
    .mutation(async ({ input }) => {
      const [found] = await db.select({ id: functions.id }).from(functions).where(eq(functions.id, input.functionId)).limit(1);
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });

      const rows = [...new Set(input.permissions)].map((permission) => ({ functionId: input.functionId, permission }));
      await db.batch([
        db.delete(functionPermissions).where(eq(functionPermissions.functionId, input.functionId)),
        ...(rows.length > 0 ? [db.insert(functionPermissions).values(rows)] : []),
      ]);
      return { success: true };
    }),
});

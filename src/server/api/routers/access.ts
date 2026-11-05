import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { loadAccess } from "@/server/access";
import { db } from "@/server/db";
import { ministries, ministryPermissions } from "@/server/db/schema";
import { isPermission, type Permission } from "@/lib/permissions";

const manageUsers = can("users.manage");

const permissionList = z.array(z.string().refine(isPermission, "Permissão inválida"));

export const accessRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const access = await loadAccess(Number(ctx.session.user.id));
    return { isAdmin: access.isAdmin, permissions: [...access.permissions] };
  }),

  getMinistryPermissions: manageUsers.input(z.object({ ministryId: z.number() })).query(async ({ input }) => {
    const rows = await db
      .select({ functionId: ministryPermissions.functionId, permission: ministryPermissions.permission })
      .from(ministryPermissions)
      .where(eq(ministryPermissions.ministryId, input.ministryId));

    const base: Permission[] = [];
    const byFunction: Record<number, Permission[]> = {};
    for (const row of rows) {
      if (!isPermission(row.permission)) continue;
      if (row.functionId === null) base.push(row.permission);
      else (byFunction[row.functionId] ??= []).push(row.permission);
    }
    return { base, byFunction };
  }),

  setMinistryPermissions: manageUsers
    .input(
      z.object({
        ministryId: z.number(),
        base: permissionList,
        byFunction: z.array(z.object({ functionId: z.number(), permissions: permissionList })),
      }),
    )
    .mutation(async ({ input }) => {
      const [ministry] = await db.select({ id: ministries.id }).from(ministries).where(eq(ministries.id, input.ministryId)).limit(1);
      if (!ministry) throw new TRPCError({ code: "NOT_FOUND", message: "Ministério não encontrado" });

      const rows = [
        ...[...new Set(input.base)].map((permission) => ({ ministryId: input.ministryId, functionId: null, permission })),
        ...input.byFunction.flatMap(({ functionId, permissions }) =>
          [...new Set(permissions)].map((permission) => ({ ministryId: input.ministryId, functionId, permission })),
        ),
      ];

      await db.batch([
        db.delete(ministryPermissions).where(eq(ministryPermissions.ministryId, input.ministryId)),
        ...(rows.length > 0 ? [db.insert(ministryPermissions).values(rows)] : []),
      ]);
      return { success: true };
    }),
});

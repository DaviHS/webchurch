import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/server/db";
import { memberMinistries, ministryPermissions, users } from "@/server/db/schema";
import { isPermission, PERMISSIONS, type Permission } from "@/lib/permissions";

export interface Access {
  isAdmin: boolean;
  permissions: Set<Permission>;
}

const NO_ACCESS: Access = { isAdmin: false, permissions: new Set() };

export async function loadAccess(userId: number): Promise<Access> {
  const [user] = await db
    .select({ status: users.status, isAdmin: users.isAdmin, memberId: users.memberId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user?.status !== "active") return NO_ACCESS;
  if (user.isAdmin) return { isAdmin: true, permissions: new Set(PERMISSIONS) };
  if (user.memberId === null) return NO_ACCESS;

  const rows = await db
    .selectDistinct({ permission: ministryPermissions.permission })
    .from(memberMinistries)
    .innerJoin(
      ministryPermissions,
      and(
        eq(ministryPermissions.ministryId, memberMinistries.ministryId),
        or(isNull(ministryPermissions.functionId), eq(ministryPermissions.functionId, memberMinistries.functionId)),
      ),
    )
    .where(and(eq(memberMinistries.memberId, user.memberId), eq(memberMinistries.isActive, true), isNull(memberMinistries.leftAt)));

  const permissions = new Set<Permission>();
  for (const row of rows) if (isPermission(row.permission)) permissions.add(row.permission);
  return { isAdmin: false, permissions };
}

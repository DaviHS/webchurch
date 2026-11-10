import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { functionPermissions, functions, memberMinistries, members, ministries, users } from "@/server/db/schema";
import { isPermission, PERMISSIONS, type Permission } from "@/lib/permissions";

export interface Access {
  isAdmin: boolean;
  permissions: Set<Permission>;
}

const NO_ACCESS: Access = { isAdmin: false, permissions: new Set() };

export async function loadAccess(userId: number): Promise<Access> {
  const [user] = await db
    .select({ status: users.status, isAdmin: users.isAdmin, memberId: users.memberId, memberStatus: members.status })
    .from(users)
    .leftJoin(members, eq(members.id, users.memberId))
    .where(eq(users.id, userId))
    .limit(1);
  if (user?.status !== "active") return NO_ACCESS;
  if (user.isAdmin) return { isAdmin: true, permissions: new Set(PERMISSIONS) };
  if (user.memberId === null || user.memberStatus !== "active") return NO_ACCESS;

  const rows = await db
    .selectDistinct({ permission: functionPermissions.permission })
    .from(memberMinistries)
    .innerJoin(ministries, and(eq(ministries.id, memberMinistries.ministryId), eq(ministries.isActive, true)))
    .innerJoin(functions, and(eq(functions.id, memberMinistries.functionId), eq(functions.isActive, true)))
    .innerJoin(functionPermissions, eq(functionPermissions.functionId, functions.id))
    .where(and(eq(memberMinistries.memberId, user.memberId), eq(memberMinistries.isActive, true), isNull(memberMinistries.leftAt)));

  const permissions = new Set<Permission>();
  for (const row of rows) if (isPermission(row.permission)) permissions.add(row.permission);
  return { isAdmin: false, permissions };
}

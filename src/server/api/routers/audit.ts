import { z } from "zod";
import { and, count, desc, ilike, or } from "drizzle-orm";
import { can, createTRPCRouter } from "@/server/api/trpc";
import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

const viewAudit = can("audit.view");

export const auditRouter = createTRPCRouter({
  list: viewAudit
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(30),
        area: z.string().max(40).optional(),
        search: z.string().trim().max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
      const filters = [];
      if (input.area) filters.push(ilike(auditLogs.action, `${input.area}.%`));
      if (input.search) {
        const term = `%${input.search.replace(/[%_]/g, "")}%`;
        filters.push(or(ilike(auditLogs.userLabel, term), ilike(auditLogs.action, term), ilike(auditLogs.target, term)));
      }
      const where = filters.length > 0 ? and(...filters) : undefined;

      const [items, [total]] = await Promise.all([
        db
          .select()
          .from(auditLogs)
          .where(where)
          .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db.select({ value: count() }).from(auditLogs).where(where),
      ]);
      const totalItems = total?.value ?? 0;
      return { items, total: totalItems, totalPages: Math.max(1, Math.ceil(totalItems / input.limit)) };
    }),
});

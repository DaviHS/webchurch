import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/server/auth";
import { loadAccess } from "@/server/access";
import { recordAudit } from "@/server/audit";
import type { Permission } from "@/lib/permissions";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  if (t._config.isDev) {
    console.info(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  }

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

export const can = (permission: Permission) =>
  protectedProcedure.use(async ({ ctx, next, type, path, getRawInput }) => {
    const userId = Number(ctx.session.user.id);
    const access = Number.isInteger(userId) ? await loadAccess(userId) : null;
    if (!access?.permissions.has(permission)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para esta ação." });
    }
    const result = await next({ ctx: { ...ctx, access } });
    if (type === "mutation" && result.ok) {
      await recordAudit({
        userId,
        userLabel: ctx.session.user.name ?? ctx.session.user.email ?? `Usuário #${userId}`,
        action: path,
        input: await getRawInput().catch(() => null),
      });
    }
    return result;
  });

export const createCallerFactory = t.createCallerFactory;

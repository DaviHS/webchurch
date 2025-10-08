import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { memberRouter } from "./routers/member";
import { ministryRouter } from './routers/ministry';
import { userRouter } from "./routers/user";
import { songRouter } from "./routers/song";
import { eventRouter } from "./routers/event";
import { registerRouter } from "./routers/register";
import { financeRouter } from "./routers/finance";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  member: memberRouter,
  ministry: ministryRouter,
  song: songRouter,
  event: eventRouter,
  register: registerRouter
  finance: financeRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { memberRouter } from "./routers/member";
import { ministriesRouter } from './routers/ministries';
import { userRouter } from "./routers/user";
import { functionsRouter } from "./routers/functions";
import { songRouter } from "./routers/song";
import { eventRouter } from "./routers/event";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  functions: functionsRouter,
  user: userRouter,
  member: memberRouter,
  ministry: ministriesRouter,
  song: songRouter,
  event: eventRouter,
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

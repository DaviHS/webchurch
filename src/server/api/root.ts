import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { memberRouter } from "./routers/member";
import { ministryRouter } from './routers/ministry';
import { userRouter } from "./routers/user";
import { songRouter } from "./routers/song";
import { eventRouter } from "./routers/event";
import { registerRouter } from "./routers/register";
import { financeRouter } from "./routers/finance";
import { presentationRouter } from "./routers/presentation";

export const appRouter = createTRPCRouter({
  user: userRouter,
  member: memberRouter,
  ministry: ministryRouter,
  song: songRouter,
  event: eventRouter,
  register: registerRouter,
  finance: financeRouter,
  presentation: presentationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

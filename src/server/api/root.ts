import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { memberRouter } from "./routers/member";
import { ministryRouter } from './routers/ministry';
import { userRouter } from "./routers/user";
import { songRouter } from "./routers/song";
import { eventRouter } from "./routers/event";
import { registerRouter } from "./routers/register";
import { financeRouter } from "./routers/finance";
import { presentationRouter } from "./routers/presentation";
import { reportRouter } from "./routers/report";
import { bibleRouter } from "./routers/bible";
import { remoteRouter } from "./routers/remote";
import { accessRouter } from "@/server/api/routers/access";

export const appRouter = createTRPCRouter({
  user: userRouter,
  member: memberRouter,
  ministry: ministryRouter,
  song: songRouter,
  event: eventRouter,
  register: registerRouter,
  finance: financeRouter,
  presentation: presentationRouter,
  report: reportRouter,
  bible: bibleRouter,
  remote: remoteRouter,
  access: accessRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

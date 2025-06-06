import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const eventsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.event.findMany({
      orderBy: { date: "asc" },
      where: {
        date: {
          gte: new Date(),
        },
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        date: z.date(),
        location: z.string().min(1),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.create({
        data: {
          title: input.title,
          description: input.description,
          date: input.date,
          location: input.location,
          imageUrl: input.imageUrl,
        },
      });
    }),
});
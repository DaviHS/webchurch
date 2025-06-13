import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const contactRouter = createTRPCRouter({
  // sendMessage: publicProcedure
  //   .input(
  //     z.object({
  //       name: z.string().min(1),
  //       email: z.string().email(),
  //       subject: z.string().min(1),
  //       message: z.string().min(10),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.db.contactMessage.create({
  //       data: {
  //         name: input.name,
  //         email: input.email,
  //         subject: input.subject,
  //         message: input.message,
  //       },
  //     });
  //   }),

  // getMessages: protectedProcedure.query(async ({ ctx }) => {
  //   return ctx.db.contactMessage.findMany({
  //     orderBy: { createdAt: "desc" },
  //   });
  // }),
});
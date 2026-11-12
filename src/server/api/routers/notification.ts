import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { can, createTRPCRouter } from "@/server/api/trpc";
import { hasPushSubscription, isPushConfigured, removePushSubscription, savePushSubscription, sendPush } from "@/server/push";

const manageMembers = can("members.manage");

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export const notificationRouter = createTRPCRouter({
  status: manageMembers.input(z.object({ endpoint: z.string().url().max(1000).nullable() })).query(async ({ ctx, input }) => ({
    configured: isPushConfigured(),
    subscribed: input.endpoint ? await hasPushSubscription(Number(ctx.session.user.id), input.endpoint) : false,
  })),

  subscribe: manageMembers.input(z.object({ subscription: subscriptionSchema })).mutation(async ({ ctx, input }) => {
    if (!isPushConfigured()) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "As notificações ainda não foram configuradas no servidor." });
    }
    await savePushSubscription(Number(ctx.session.user.id), input.subscription);
    return { success: true };
  }),

  unsubscribe: manageMembers.input(z.object({ endpoint: z.string().url().max(1000) })).mutation(async ({ ctx, input }) => {
    await removePushSubscription(Number(ctx.session.user.id), input.endpoint);
    return { success: true };
  }),

  sendTest: manageMembers.mutation(async ({ ctx }) => {
    const sent = await sendPush([Number(ctx.session.user.id)], {
      title: "Notificações ativas",
      body: "Você vai receber o aviso dos aniversariantes do dia.",
      url: "/app",
    });
    if (sent === 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Nenhum aparelho seu está ativo para receber." });
    return { sent };
  }),
});

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gt } from "drizzle-orm";
import { hash } from "bcrypt-ts";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { recordAudit } from "@/server/audit";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { escapeHtml, sendEmail } from "@/server/email";
import { DEFAULT_PASSWORD } from "@/lib/default-password";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
}

function resetEmail(link: string) {
  const text = [
    "Recebemos um pedido para redefinir a sua senha no sistema da Igreja Central - Vida com Propósito.",
    "",
    `Para criar uma nova senha, acesse (o link vale por 1 hora):`,
    link,
    "",
    "Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.",
  ].join("\n");
  const safeLink = escapeHtml(link);
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
<p>Recebemos um pedido para redefinir a sua senha no sistema da <strong>Igreja Central - Vida com Propósito</strong>.</p>
<p><a href="${safeLink}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Criar nova senha</a></p>
<p style="font-size:13px;color:#555">O link vale por 1 hora. Se o botão não funcionar, copie este endereço no navegador:<br>${safeLink}</p>
<p style="font-size:13px;color:#555">Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.</p>
</div>`;
  return { subject: "Redefinição de senha", text, html };
}

export const passwordResetRouter = createTRPCRouter({
  /** Sempre responde igual, exista ou não o e-mail, para não revelar quem tem cadastro. */
  request: publicProcedure.input(z.object({ email: z.string().trim().toLowerCase().email().max(100) })).mutation(async ({ input }) => {
    const [user] = await db
      .select({ id: users.id, email: users.email, status: users.status, resetTokenExpires: users.resetTokenExpires })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (user?.status !== "active") return { success: true };

    // Já enviamos há instantes: não gera outro (evita uso do formulário para disparar e-mails em série).
    const sentAt = user.resetTokenExpires ? user.resetTokenExpires.getTime() - TOKEN_TTL_MS : 0;
    if (Date.now() - sentAt < RESEND_COOLDOWN_MS) return { success: true };

    const base = appUrl();
    if (!base) {
      console.error("[password-reset] NEXT_PUBLIC_APP_URL não configurada.");
      return { success: true };
    }

    const token = randomBytes(32).toString("base64url");
    await db
      .update(users)
      .set({ resetToken: hashToken(token), resetTokenExpires: new Date(Date.now() + TOKEN_TTL_MS), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const link = `${base}/reset-password?token=${token}`;
    const sent = await sendEmail({ to: user.email, ...resetEmail(link) });
    if (!sent && process.env.NODE_ENV !== "production") console.info("[password-reset] link (dev):", link);

    await recordAudit({ userId: user.id, userLabel: user.email, action: "auth.requestPasswordReset", input: { emailSent: sent } });
    return { success: true };
  }),

  confirm: publicProcedure
    .input(z.object({ token: z.string().min(20).max(200), newPassword: z.string().min(6).max(100) }))
    .mutation(async ({ input }) => {
      if (input.newPassword === DEFAULT_PASSWORD) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A nova senha deve ser diferente da senha padrão." });
      }
      const now = new Date();
      const passwordHash = await hash(input.newPassword, 10);

      // Consome o token numa única gravação condicional: só vale uma vez, mesmo com pedidos simultâneos.
      const [user] = await db
        .update(users)
        .set({ passwordHash, passwordUpdatedAt: now, updatedAt: now, resetToken: null, resetTokenExpires: now })
        .where(and(eq(users.resetToken, hashToken(input.token)), gt(users.resetTokenExpires, now), eq(users.status, "active")))
        .returning({ id: users.id, email: users.email });
      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado. Peça um novo." });
      }

      await recordAudit({ userId: user.id, userLabel: user.email, action: "auth.confirmPasswordReset", input: null });
      return { success: true };
    }),
});

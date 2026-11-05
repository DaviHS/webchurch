const RESEND_URL = "https://api.resend.com/emails";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Envia um e-mail pelo Resend. Devolve false (sem lançar) quando não está configurado
 * ou o envio falha, para quem chama decidir o que fazer.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY/EMAIL_FROM não configurados; e-mail não enviado.");
    return false;
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
    });
    if (!response.ok) {
      console.error("[email] Resend recusou o envio", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] falha ao enviar", error);
    return false;
  }
}

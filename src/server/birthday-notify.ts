import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { members, users } from "@/server/db/schema";
import { loadAccess } from "@/server/access";
import { sendEmail, escapeHtml } from "@/server/email";
import { sendPush } from "@/server/push";
import { getSetting, setSetting } from "@/server/settings";
import { logError } from "@/server/log";
import { birthdayMessage, saoPauloToday, type BirthdayPerson } from "@/lib/birthday-message";
import { ageOn } from "@/lib/birthdays";

const DONE_KEY = "birthday_notified_on";

async function leaders(): Promise<{ id: number; email: string | null }[]> {
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.status, "active"));
  const result: { id: number; email: string | null }[] = [];
  for (const row of rows) {
    const access = await loadAccess(row.id);
    if (access.permissions.has("members.manage")) result.push(row);
  }
  return result;
}

export async function notifyTodayBirthdays(): Promise<{ people: number; pushes: number; emails: number }> {
  const today = saoPauloToday();
  if ((await getSetting(DONE_KEY)) === today.iso) return { people: 0, pushes: 0, emails: 0 };

  const rows = await db
    .select({ firstName: members.firstName, lastName: members.lastName, birthDate: members.birthDate })
    .from(members)
    .where(
      and(
        eq(members.status, "active"),
        isNotNull(members.birthDate),
        sql`extract(month from ${members.birthDate}) = ${today.month}`,
        sql`extract(day from ${members.birthDate}) = ${today.day}`,
      ),
    );

  const people: BirthdayPerson[] = rows.map((row) => ({
    name: [row.firstName, row.lastName].filter(Boolean).join(" "),
    turning: row.birthDate ? ageOn(row.birthDate, today.iso) : null,
  }));
  const message = birthdayMessage(people);
  await setSetting(DONE_KEY, today.iso);
  if (!message) return { people: 0, pushes: 0, emails: 0 };

  const recipients = await leaders();
  const pushes = await sendPush(
    recipients.map((recipient) => recipient.id),
    { ...message, url: "/app/admin/members" },
  );

  let emails = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    try {
      const sent = await sendEmail({
        to: recipient.email,
        subject: message.title,
        text: message.body,
        html: `<p><strong>${escapeHtml(message.title)}</strong></p><p>${escapeHtml(message.body)}</p>`,
      });
      if (sent) emails += 1;
    } catch (error) {
      logError("aniversariantes: e-mail não enviado", error);
    }
  }
  return { people: people.length, pushes, emails };
}

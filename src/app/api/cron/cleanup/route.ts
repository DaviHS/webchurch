import { NextResponse } from "next/server";
import { notifyTodayBirthdays } from "@/server/birthday-notify";
import { cleanupPresentationSessions } from "@/server/presentation-cleanup";
import { cleanupOldEventPlaylists } from "@/server/spotify-cleanup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const presentation = await cleanupPresentationSessions();
  await cleanupOldEventPlaylists();
  const birthdays = await notifyTodayBirthdays();
  return NextResponse.json({ ok: true, presentation, birthdays });
}

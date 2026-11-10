import { inArray, like } from "drizzle-orm";
import { db } from "@/server/db";
import { appSettings, events } from "@/server/db/schema";
import { spotifyService } from "@/lib/spotify";
import { deleteSetting, getSetting, setSetting } from "@/server/settings";

export const EVENT_PLAYLIST_PREFIX = "event_spotify_playlist:";
export const EVENT_PLAYLIST_KEEP_DAYS = 30;

const CHECK_KEY = "spotify_playlist_cleanup_at";
const DAY_MS = 86_400_000;

export async function cleanupOldEventPlaylists(): Promise<void> {
  try {
    if (!spotifyService.isConfigured()) return;
    const last = new Date((await getSetting(CHECK_KEY)) ?? 0).getTime();
    if (Date.now() - last < DAY_MS) return;
    await setSetting(CHECK_KEY, new Date().toISOString());

    const saved = await db
      .select({ key: appSettings.key, value: appSettings.value })
      .from(appSettings)
      .where(like(appSettings.key, `${EVENT_PLAYLIST_PREFIX}%`));
    if (saved.length === 0) return;

    const eventIds = saved.map((row) => Number(row.key.slice(EVENT_PLAYLIST_PREFIX.length))).filter(Number.isInteger);
    const dates = new Map(
      (eventIds.length > 0 ? await db.select({ id: events.id, date: events.date }).from(events).where(inArray(events.id, eventIds)) : []).map(
        (row) => [row.id, row.date.getTime()],
      ),
    );
    const cutoff = Date.now() - EVENT_PLAYLIST_KEEP_DAYS * DAY_MS;

    for (const row of saved) {
      const eventDate = dates.get(Number(row.key.slice(EVENT_PLAYLIST_PREFIX.length)));
      if (eventDate !== undefined && eventDate >= cutoff) continue;
      try {
        const playlistId = (JSON.parse(row.value) as { id?: string }).id;
        if (playlistId) await spotifyService.deletePlaylist(playlistId);
        await deleteSetting(row.key);
      } catch (error) {
        console.error("[spotify] não foi possível apagar a playlist antiga:", error instanceof Error ? error.message : error);
      }
    }
  } catch (error) {
    console.error("[spotify] limpeza das playlists de eventos falhou:", error instanceof Error ? error.message : error);
  }
}

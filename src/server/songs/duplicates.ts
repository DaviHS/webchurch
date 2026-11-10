import { ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { songKey } from "@/lib/song-key";

export async function findDuplicate(title: string, artist: string | null | undefined, excludeId?: number) {
  const key = songKey(title, artist);
  const rows = await db
    .select({ id: songs.id, title: songs.title, artist: songs.artist })
    .from(songs)
    .where(excludeId === undefined ? undefined : ne(songs.id, excludeId));
  return rows.find((row) => songKey(row.title, row.artist) === key) ?? null;
}

export async function assertNoDuplicate(title: string, artist: string | null | undefined, excludeId?: number) {
  const duplicate = await findDuplicate(title, artist, excludeId);
  if (!duplicate) return;
  const by = duplicate.artist ? ` de ${duplicate.artist}` : "";
  throw new TRPCError({ code: "CONFLICT", message: `Já existe a música "${duplicate.title}"${by}.` });
}

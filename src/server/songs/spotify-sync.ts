import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { spotifyService } from "@/lib/spotify";
import { getSpotifyPlaylistId } from "./integrations";

const RESOLVE_LIMIT = 40;

async function findMissingTracks() {
  const candidates = await db
    .select({ id: songs.id, title: songs.title, artist: songs.artist })
    .from(songs)
    .where(sql`${songs.spotifyTrackId} is null and ${songs.spotifyUrl} is null`)
    .orderBy(asc(songs.id))
    .limit(RESOLVE_LIMIT + 1);

  const batch = candidates.slice(0, RESOLVE_LIMIT);
  let resolved = 0;
  let notFound = 0;
  for (const song of batch) {
    const track = await spotifyService.searchTrack(song.title, song.artist);
    if (!track) {
      notFound += 1;
      continue;
    }
    await db
      .update(songs)
      .set({ spotifyUrl: track.external_urls.spotify, spotifyTrackId: track.id, updatedAt: new Date() })
      .where(eq(songs.id, song.id));
    resolved += 1;
  }
  return { resolved, notFound, remaining: candidates.length - batch.length };
}

export async function syncSpotifyPlaylist() {
  const playlistId = await getSpotifyPlaylistId();
  if (!playlistId || !spotifyService.isConfigured()) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A integração com o Spotify não está configurada." });
  }

  try {
    const search = await findMissingTracks();
    const linked = await db
      .select({ trackId: songs.spotifyTrackId })
      .from(songs)
      .where(and(isNotNull(songs.spotifyTrackId), eq(songs.skipPlaylist, false)));
    const added = await spotifyService.addTracks(playlistId, linked.flatMap((row) => (row.trackId ? [row.trackId] : [])));
    return { ...search, added };
  } catch (error) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: error instanceof Error ? error.message : "Falha ao sincronizar a playlist do Spotify",
    });
  }
}

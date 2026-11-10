import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { youtubeService } from "@/lib/youtube";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import { needsDuration } from "./duration";
import { logError } from "@/server/log";

const RESOLVE_LIMIT = 30;

/** Tira da playlist e desvincula os vídeos apagados ou privados, para a busca seguinte achar outro. */
async function unlinkUnavailableVideos(): Promise<number> {
  let unlinked = 0;
  try {
    const linked = await db
      .select({ id: songs.id, videoId: songs.youtubeVideoId })
      .from(songs)
      .where(and(isNotNull(songs.youtubeVideoId), eq(songs.skipPlaylist, false)));
    const dead = await youtubeService.findUnavailable(linked.flatMap((row) => (row.videoId ? [row.videoId] : [])));

    for (const row of linked) {
      if (!row.videoId || !dead.has(row.videoId)) continue;
      await youtubeService.removeFromPlaylist(row.videoId).catch((error: unknown) => logError("youtube: vídeo não saiu da playlist", error));
      await db
        .update(songs)
        .set({ youtubeUrl: null, youtubeVideoId: null, duration: null, updatedAt: new Date() })
        .where(eq(songs.id, row.id));
      unlinked += 1;
    }
  } catch (error) {
    logError("youtube: vídeos indisponíveis não conferidos", error);
  }
  return unlinked;
}

/** Busca no YouTube as músicas sem vídeo, até o limite por vez (cada busca gasta cota). */
async function findMissingVideos() {
  const candidates = await db
    .select({ id: songs.id, title: songs.title, artist: songs.artist })
    .from(songs)
    .where(and(isNull(songs.youtubeVideoId), isNull(songs.youtubeUrl), eq(songs.skipPlaylist, false)))
    .orderBy(sql`random()`)
    .limit(RESOLVE_LIMIT + 1);

  const batch = candidates.slice(0, RESOLVE_LIMIT);
  let resolved = 0;
  let notFound = 0;
  let unresolvedLeft = candidates.length - batch.length;

  for (const song of batch) {
    try {
      const videoId = await youtubeService.searchVideo(song.title, song.artist);
      if (!videoId) {
        notFound += 1;
        continue;
      }
      await db
        .update(songs)
        .set({ youtubeUrl: youtubeWatchUrl(videoId), youtubeVideoId: videoId, updatedAt: new Date() })
        .where(eq(songs.id, song.id));
      resolved += 1;
    } catch (error) {
      logError("youtube: busca interrompida (cota ou falha da API)", error);
      unresolvedLeft += batch.length - resolved - notFound;
      break;
    }
  }
  return { resolved, notFound, unresolvedLeft };
}

/** Põe na playlist os vídeos que faltam e preenche as durações ausentes. */
async function syncPlaylistAndDurations() {
  const rows = await db
    .select({ id: songs.id, videoId: songs.youtubeVideoId, duration: songs.duration, skipPlaylist: songs.skipPlaylist })
    .from(songs)
    .where(isNotNull(songs.youtubeVideoId));
  const withVideo = rows.flatMap((row) => (row.videoId ? [{ ...row, videoId: row.videoId }] : []));

  const playlist = await youtubeService.syncPlaylist(withVideo.filter((row) => !row.skipPlaylist).map((row) => row.videoId));

  const missing = withVideo.filter((row) => needsDuration(row.duration));
  const durations = await youtubeService.getVideoDurations(missing.map((row) => row.videoId));
  const updates = missing.flatMap((row) => {
    const seconds = durations.get(row.videoId);
    return seconds ? [db.update(songs).set({ duration: seconds, updatedAt: new Date() }).where(eq(songs.id, row.id))] : [];
  });
  const [first, ...rest] = updates;
  if (first) await db.batch([first, ...rest]);

  return { ...playlist, durationsFilled: updates.length };
}

export async function syncYouTubePlaylist() {
  const configured = youtubeService.isConfigured();
  const unlinkedDead = configured ? await unlinkUnavailableVideos() : 0;
  const search = configured ? await findMissingVideos() : { resolved: 0, notFound: 0, unresolvedLeft: 0 };

  try {
    return { ...(await syncPlaylistAndDurations()), unlinkedDead, ...search };
  } catch (error) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: error instanceof Error ? error.message : "Falha ao sincronizar a playlist do YouTube",
    });
  }
}

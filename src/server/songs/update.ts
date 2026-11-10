import type { z } from "zod";
import type { songs } from "@/server/db/schema";
import { songKey } from "@/lib/song-key";
import type { songSchema } from "@/validators/song";
import { emptyToNull, normalizeLink } from "./common";
import { assertNoDuplicate } from "./duplicates";
import { resolveDuration } from "./duration";
import { resolveSpotify, resolveYouTube } from "./integrations";

type Song = typeof songs.$inferSelect;
type SongChanges = Partial<typeof songs.$inferInsert>;
export type SongPatch = Partial<z.output<typeof songSchema>>;

export interface SongUpdatePlan {
  changes: SongChanges;
  videoId: string | null;
  trackId: string | null;
  skipPlaylist: boolean;
}

/** Decide o que muda na música, sem gravar nada. Resolve links e duração e valida duplicidade. */
export async function planSongUpdate(
  current: Song,
  data: SongPatch,
  options: { allowDuplicate: boolean },
  warnings: string[],
): Promise<SongUpdatePlan> {
  const title = data.title ?? current.title;
  const artist = data.artist ?? current.artist;

  const identityChanged = songKey(title, artist) !== songKey(current.title, current.artist);
  if (identityChanged && !options.allowDuplicate) await assertNoDuplicate(title, artist, current.id);

  const youtubeChanged =
    data.youtubeUrl !== undefined && (normalizeLink(data.youtubeUrl) !== current.youtubeUrl || !current.youtubeVideoId);
  const spotifyChanged =
    data.spotifyUrl !== undefined && (normalizeLink(data.spotifyUrl) !== current.spotifyUrl || !current.spotifyTrackId);

  const [youtube, spotify] = await Promise.all([
    youtubeChanged ? resolveYouTube(data.youtubeUrl, title, artist, warnings) : undefined,
    spotifyChanged ? resolveSpotify(data.spotifyUrl, title, artist, warnings) : undefined,
  ]);

  const videoId = youtube ? youtube.youtubeVideoId : current.youtubeVideoId;
  const trackId = spotify ? spotify.spotifyTrackId : current.spotifyTrackId;

  const changes: SongChanges = {
    title: data.title,
    category: data.category,
    artist: emptyToNull(data.artist),
    lyrics: emptyToNull(data.lyrics),
    key: emptyToNull(data.key),
    duration: data.duration,
    skipPlaylist: data.skipPlaylist,
    ...youtube,
    ...spotify,
  };

  if (!(data.duration ?? current.duration)) changes.duration = await resolveDuration(videoId, trackId, warnings);

  return { changes, videoId, trackId, skipPlaylist: data.skipPlaylist ?? current.skipPlaylist };
}

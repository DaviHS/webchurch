import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { songs, eventSongs } from "@/server/db/schema";
import { songSchema, songCategories, type SongCategory } from "@/validators/song";
import { eq, ne, asc, desc, and, or, sql, count, inArray, isNotNull, type SQL } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";
import { songKey } from "@/lib/song-key";
import { youtubeService, YouTubeIntegrationError } from "@/lib/youtube";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import { spotifyService } from "@/lib/spotify";

const SPOTIFY_PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

const emptyToNull = (value: string | null | undefined) =>
  value === undefined ? undefined : value === null || value.trim() === "" ? null : value;

const normalizeLink = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
};

async function findDuplicate(title: string, artist: string | null | undefined, excludeId?: number) {
  const key = songKey(title, artist);
  const rows = await db
    .select({ id: songs.id, title: songs.title, artist: songs.artist })
    .from(songs)
    .where(excludeId === undefined ? undefined : ne(songs.id, excludeId));
  return rows.find((row) => songKey(row.title, row.artist) === key) ?? null;
}

async function assertNoDuplicate(title: string, artist: string | null | undefined, excludeId?: number) {
  const duplicate = await findDuplicate(title, artist, excludeId);
  if (!duplicate) return;
  const by = duplicate.artist ? ` de ${duplicate.artist}` : "";
  throw new TRPCError({ code: "CONFLICT", message: `Já existe a música "${duplicate.title}"${by}.` });
}

const integrationWarning =(what: string, error: unknown) =>
  `Música salva, mas ${what}: ${error instanceof Error ? error.message : "erro desconhecido"}`;

interface YouTubeFields {
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
}

async function resolveYouTube(
  url: string | null | undefined,
  title: string,
  artist: string | null | undefined,
  warnings: string[]
): Promise<YouTubeFields> {
  const link = normalizeLink(url);
  if (link) {
    const youtubeVideoId = youtubeService.extractVideoId(link);
    if (!youtubeVideoId) warnings.push("O link informado não é um vídeo do YouTube reconhecido.");
    return { youtubeUrl: link, youtubeVideoId };
  }
  if (!youtubeService.isConfigured()) return { youtubeUrl: null, youtubeVideoId: null };

  try {
    const videoId = await youtubeService.searchVideo(title, artist);
    return videoId
      ? { youtubeUrl: youtubeWatchUrl(videoId), youtubeVideoId: videoId }
      : { youtubeUrl: null, youtubeVideoId: null };
  } catch (error) {
    warnings.push(integrationWarning("não foi possível buscar o vídeo no YouTube", error));
    return { youtubeUrl: null, youtubeVideoId: null };
  }
}

async function isVideoUsedElsewhere(videoId: string, exceptSongId?: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(songs)
    .where(and(eq(songs.youtubeVideoId, videoId), exceptSongId ? ne(songs.id, exceptSongId) : undefined));
  return (row?.count ?? 0) > 0;
}

async function syncPlaylistVideo(
  oldId: string | null,
  newId: string | null,
  songId: number | undefined,
  warnings: string[]
): Promise<void> {
  if (!youtubeService.playlistId || !youtubeService.isConfigured() || oldId === newId) return;
  try {
    if (oldId && !(await isVideoUsedElsewhere(oldId, songId))) await youtubeService.removeFromPlaylist(oldId);
    if (newId) await youtubeService.addToPlaylist(newId);
  } catch (error) {
    if (error instanceof YouTubeIntegrationError && error.reason === "not_configured") return;
    warnings.push(integrationWarning("a playlist do YouTube não foi atualizada", error));
  }
}

async function durationFromVideo(videoId: string | null, warnings: string[]): Promise<number | undefined> {
  if (!videoId || !youtubeService.isConfigured()) return undefined;
  try {
    return (await youtubeService.getVideoDurations([videoId])).get(videoId);
  } catch (error) {
    warnings.push(integrationWarning("não foi possível obter a duração do vídeo", error));
    return undefined;
  }
}

interface SpotifyFields {
  spotifyUrl: string | null;
  spotifyTrackId: string | null;
}

async function resolveSpotify(
  url: string | null | undefined,
  title: string,
  artist: string | null | undefined
): Promise<SpotifyFields> {
  const link = normalizeLink(url);
  if (link) {
    const data = spotifyService.extractId(link);
    return { spotifyUrl: link, spotifyTrackId: data?.type === "track" ? data.id : null };
  }
  const track = await spotifyService.searchTrack(title, artist);
  return track
    ? { spotifyUrl: track.external_urls.spotify, spotifyTrackId: track.id }
    : { spotifyUrl: null, spotifyTrackId: null };
}

async function syncSpotifyTrack(oldId: string | null, newId: string | null): Promise<void> {
  if (!SPOTIFY_PLAYLIST_ID || oldId === newId) return;
  if (oldId) await spotifyService.removeFromPlaylist(oldId, SPOTIFY_PLAYLIST_ID);
  if (newId) await spotifyService.addToPlaylist(newId, SPOTIFY_PLAYLIST_ID);
}

export const songRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z
          .string()
          .optional()
          .transform((v) =>
            songCategories.includes(v as SongCategory) ? (v as SongCategory) : undefined
          ),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { search, category, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions: SQL[] = [];

      if (search && search.trim() !== "") {
        const searchLower = `%${search.trim().toLowerCase()}%`;
        const searchCondition = or(
          sql`LOWER(${songs.title}) LIKE ${searchLower}`,
          sql`LOWER(${songs.artist}) LIKE ${searchLower}`
        );
        if (searchCondition) whereConditions.push(searchCondition);
      }

      if (category) {
        whereConditions.push(eq(songs.category, category));
      }

      const where = whereConditions.length ? and(...whereConditions) : undefined;

      const [data, total] = await Promise.all([
        db.select()
          .from(songs)
          .where(where)
          .orderBy(desc(songs.createdAt), desc(songs.id))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(songs)
          .where(where),
      ]);

      const totalCount = total[0]?.count ?? 0;

      return {
        songs: data,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const song = await db
      .select()
      .from(songs)
      .where(eq(songs.id, input))
      .then((res) => res[0]);
    return song ?? null;
  }),

  findDuplicate: protectedProcedure
    .input(z.object({ title: z.string(), artist: z.string().optional(), excludeId: z.number().optional() }))
    .query(({ input }) => (input.title.trim() ? findDuplicate(input.title, input.artist, input.excludeId) : null)),

  duplicateGroups: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        id: songs.id,
        title: songs.title,
        artist: songs.artist,
        hasLyrics: sql<boolean>`coalesce(length(trim(${songs.lyrics})) > 0, false)`,
        hasVideo: sql<boolean>`${songs.youtubeVideoId} is not null`,
        events: sql<number>`(select count(*)::int from event_songs es where es.song_id = songs.id)`,
      })
      .from(songs)
      .orderBy(asc(songs.id));

    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = songKey(row.title, row.artist);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return [...groups.values()].filter((group) => group.length > 1);
  }),

  merge: protectedProcedure
    .input(z.object({ keepId: z.number(), removeIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      const removeIds = input.removeIds.filter((id) => id !== input.keepId);
      const rows = await db.select().from(songs).where(inArray(songs.id, [input.keepId, ...removeIds]));
      const keep = rows.find((row) => row.id === input.keepId);
      const removed = rows.filter((row) => row.id !== input.keepId);
      if (!keep || removed.length !== removeIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Música não encontrada" });
      }

      const fill: Partial<typeof songs.$inferInsert> = {};
      const firstWith = <K extends keyof typeof keep>(field: K) => removed.find((row) => Boolean(row[field]))?.[field];
      if (!keep.lyrics?.trim()) fill.lyrics = firstWith("lyrics") ?? keep.lyrics;
      if (!keep.chords?.trim()) fill.chords = firstWith("chords") ?? keep.chords;
      if (!keep.duration) fill.duration = firstWith("duration") ?? keep.duration;
      if (!keep.spotifyTrackId) {
        fill.spotifyUrl = firstWith("spotifyUrl") ?? keep.spotifyUrl;
        fill.spotifyTrackId = firstWith("spotifyTrackId") ?? keep.spotifyTrackId;
      }
      const donor = keep.youtubeVideoId ? undefined : removed.find((row) => row.youtubeVideoId);
      if (donor) {
        fill.youtubeUrl = donor.youtubeUrl;
        fill.youtubeVideoId = donor.youtubeVideoId;
      }

      await db.update(eventSongs).set({ songId: keep.id }).where(inArray(eventSongs.songId, removeIds));
      if (Object.keys(fill).length > 0) await db.update(songs).set(fill).where(eq(songs.id, keep.id));
      await db.delete(songs).where(inArray(songs.id, removeIds));

      const warnings: string[] = [];
      const keptVideo = keep.youtubeVideoId ?? donor?.youtubeVideoId ?? null;
      for (const row of removed) {
        if (row.youtubeVideoId && row.youtubeVideoId !== keptVideo) {
          await syncPlaylistVideo(row.youtubeVideoId, null, row.id, warnings);
        }
        if (row.spotifyTrackId && row.spotifyTrackId !== (fill.spotifyTrackId ?? keep.spotifyTrackId)) {
          await syncSpotifyTrack(row.spotifyTrackId, null);
        }
      }
      return { merged: removed.length, warnings };
    }),

  create: protectedProcedure.input(songSchema.extend({ allowDuplicate: z.boolean().optional() })).mutation(async ({ input: { allowDuplicate, ...input } }) => {
    if (!allowDuplicate) await assertNoDuplicate(input.title, input.artist);
    const warnings: string[] = [];

    const [youtube, spotify] = await Promise.all([
      resolveYouTube(input.youtubeUrl, input.title, input.artist, warnings),
      resolveSpotify(input.spotifyUrl, input.title, input.artist),
    ]);

    const [duration] = await Promise.all([
      input.duration ? Promise.resolve(input.duration) : durationFromVideo(youtube.youtubeVideoId, warnings),
      syncPlaylistVideo(null, youtube.youtubeVideoId, undefined, warnings),
      syncSpotifyTrack(null, spotify.spotifyTrackId),
    ]);

    const [song] = await db
      .insert(songs)
      .values(cleanEmptyStrings({ ...input, ...youtube, ...spotify, duration }))
      .returning();

    return { song, warnings };
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: songSchema.partial(),
        allowDuplicate: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data } = input;
      const warnings: string[] = [];

      const currentSong = await db
        .select()
        .from(songs)
        .where(eq(songs.id, input.id))
        .then((res) => res[0]);

      if (!currentSong) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Música não encontrada" });
      }

      const title = data.title ?? currentSong.title;
      const artist = data.artist ?? currentSong.artist;

      const identityChanged = songKey(title, artist) !== songKey(currentSong.title, currentSong.artist);
      if (identityChanged && !input.allowDuplicate) await assertNoDuplicate(title, artist, currentSong.id);

      const updateData: Partial<typeof songs.$inferInsert> = {
        title: data.title,
        category: data.category,
        artist: emptyToNull(data.artist),
        lyrics: emptyToNull(data.lyrics),
        key: emptyToNull(data.key),
        duration: data.duration,
      };

      const youtubeChanged =
        data.youtubeUrl !== undefined &&
        (normalizeLink(data.youtubeUrl) !== currentSong.youtubeUrl || !currentSong.youtubeVideoId);
      const spotifyChanged =
        data.spotifyUrl !== undefined &&
        (normalizeLink(data.spotifyUrl) !== currentSong.spotifyUrl || !currentSong.spotifyTrackId);

      const updateYouTube = async () => {
        const youtube = await resolveYouTube(data.youtubeUrl, title, artist, warnings);
        Object.assign(updateData, youtube);
        await syncPlaylistVideo(currentSong.youtubeVideoId, youtube.youtubeVideoId, currentSong.id, warnings);
      };

      const updateSpotify = async () => {
        const spotify = await resolveSpotify(data.spotifyUrl, title, artist);
        Object.assign(updateData, spotify);
        await syncSpotifyTrack(currentSong.spotifyTrackId, spotify.spotifyTrackId);
      };

      await Promise.all([
        youtubeChanged ? updateYouTube() : Promise.resolve(),
        spotifyChanged ? updateSpotify() : Promise.resolve(),
      ]);

      const effectiveDuration = data.duration ?? currentSong.duration;
      if (!effectiveDuration) {
        const videoId = "youtubeVideoId" in updateData ? (updateData.youtubeVideoId ?? null) : currentSong.youtubeVideoId;
        const fromVideo = await durationFromVideo(videoId, warnings);
        if (fromVideo) updateData.duration = fromVideo;
      }

      const [song] = await db
        .update(songs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(songs.id, input.id))
        .returning();

      return { song, warnings };
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const [usage] = await db
      .select({ count: count() })
      .from(eventSongs)
      .where(eq(eventSongs.songId, input));

    if (usage && usage.count > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Esta música está em ${usage.count} evento(s) e não pode ser excluída.`,
      });
    }

    const [deleted] = await db
      .delete(songs)
      .where(eq(songs.id, input))
      .returning({ youtubeVideoId: songs.youtubeVideoId });

    const warnings: string[] = [];
    if (deleted?.youtubeVideoId) {
      await syncPlaylistVideo(deleted.youtubeVideoId, null, input, warnings);
    }
    return { success: true, warnings };
  }),

  getYouTubeStatus: protectedProcedure
    .input(z.object({ force: z.boolean().default(false) }).optional())
    .query(({ input }) => youtubeService.getStatus({ force: input?.force ?? false })),

  syncYouTubePlaylist: protectedProcedure.mutation(async () => {
    const rows = await db
      .select({ id: songs.id, videoId: songs.youtubeVideoId, duration: songs.duration })
      .from(songs)
      .where(isNotNull(songs.youtubeVideoId));

    const withVideo = rows.flatMap((row) => (row.videoId ? [{ ...row, videoId: row.videoId }] : []));

    try {
      const playlist = await youtubeService.syncPlaylist(withVideo.map((row) => row.videoId));

      const missingDuration = withVideo.filter((row) => !row.duration);
      const durations = await youtubeService.getVideoDurations(missingDuration.map((row) => row.videoId));
      const updates = missingDuration.flatMap((row) => {
        const seconds = durations.get(row.videoId);
        return seconds ? [db.update(songs).set({ duration: seconds, updatedAt: new Date() }).where(eq(songs.id, row.id))] : [];
      });
      const [first, ...rest] = updates;
      if (first) await db.batch([first, ...rest]);

      return { ...playlist, durationsFilled: updates.length };
    } catch (error) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: error instanceof Error ? error.message : "Falha ao sincronizar a playlist do YouTube",
      });
    }
  }),
});

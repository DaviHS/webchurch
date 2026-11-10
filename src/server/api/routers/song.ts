import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { songs, eventSongs } from "@/server/db/schema";
import { songSchema, songCategories, type SongCategory } from "@/validators/song";
import { eq, ne, asc, desc, and, or, sql, count, inArray, isNotNull, isNull, getTableColumns, type SQL } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";
import { songKey } from "@/lib/song-key";
import { findLyrics } from "@/lib/lyrics-search";
import { youtubeService, YouTubeIntegrationError } from "@/lib/youtube";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import { spotifyService, SpotifyIntegrationError } from "@/lib/spotify";
import { getSetting, SETTING_SPOTIFY_PLAYLIST_ID } from "@/server/settings";

const YOUTUBE_RESOLVE_LIMIT = 30;

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

const integrationWarning = (what: string, error: unknown) => {
  console.error(`[integração] ${what}:`, error instanceof Error ? error.message : error);
  return `Música salva, mas ${what}. Avise o setor de desenvolvimento para verificar a integração.`;
};

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
    .where(and(eq(songs.youtubeVideoId, videoId), eq(songs.skipPlaylist, false), exceptSongId ? ne(songs.id, exceptSongId) : undefined));
  return (row?.count ?? 0) > 0;
}

async function syncPlaylistVideo(
  oldId: string | null,
  newId: string | null,
  songId: number | undefined,
  warnings: string[]
): Promise<void> {
  if (!youtubeService.isConfigured() || oldId === newId || !(await youtubeService.getPlaylistId())) return;
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
  artist: string | null | undefined,
  warnings: string[]
): Promise<SpotifyFields> {
  const link = normalizeLink(url);
  if (link) {
    const data = spotifyService.extractId(link);
    if (data?.type !== "track") warnings.push("O link informado não é uma faixa do Spotify reconhecida.");
    return { spotifyUrl: link, spotifyTrackId: data?.type === "track" ? data.id : null };
  }
  if (!spotifyService.isConfigured()) return { spotifyUrl: null, spotifyTrackId: null };
  try {
    const track = await spotifyService.searchTrack(title, artist);
    return track
      ? { spotifyUrl: track.external_urls.spotify, spotifyTrackId: track.id }
      : { spotifyUrl: null, spotifyTrackId: null };
  } catch (error) {
    warnings.push(integrationWarning("não foi possível buscar a faixa no Spotify", error));
    return { spotifyUrl: null, spotifyTrackId: null };
  }
}

const getSpotifyPlaylistId = () => getSetting(SETTING_SPOTIFY_PLAYLIST_ID);

async function isTrackUsedElsewhere(trackId: string, exceptSongId?: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(songs)
    .where(and(eq(songs.spotifyTrackId, trackId), eq(songs.skipPlaylist, false), exceptSongId ? ne(songs.id, exceptSongId) : undefined));
  return (row?.count ?? 0) > 0;
}

async function syncSpotifyTrack(
  oldId: string | null,
  newId: string | null,
  songId: number | undefined,
  warnings: string[]
): Promise<void> {
  if (oldId === newId || !spotifyService.isConfigured()) return;
  const playlistId = await getSpotifyPlaylistId();
  if (!playlistId) return;
  try {
    if (oldId && !(await isTrackUsedElsewhere(oldId, songId))) await spotifyService.removeTrack(playlistId, oldId);
    if (newId) await spotifyService.addTracks(playlistId, [newId]);
  } catch (error) {
    if (error instanceof SpotifyIntegrationError && error.reason === "not_configured") return;
    warnings.push(integrationWarning("a playlist do Spotify não foi atualizada", error));
  }
}

const SPOTIFY_RESOLVE_LIMIT = 40;

const editSongs = can("songs.edit");

const NO_YOUTUBE = sql`(${songs.youtubeUrl} is null or trim(${songs.youtubeUrl}) = '') and ${songs.youtubeVideoId} is null`;
const NO_SPOTIFY = sql`(${songs.spotifyUrl} is null or trim(${songs.spotifyUrl}) = '') and ${songs.spotifyTrackId} is null`;

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
        sort: z.enum(["recent", "title", "mostPlayed", "leastPlayed"]).default("recent"),
        noLyrics: z.boolean().optional(),
        missingLink: z.enum(["youtube", "spotify"]).optional(),
        page: z.number().min(1).default(1),
        cursor: z.number().min(1).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { search, category, sort, noLyrics, missingLink, limit } = input;
      const page = input.cursor ?? input.page;
      const offset = (page - 1) * limit;

      const whereConditions: SQL[] = [];

      if (search && search.trim() !== "") {
        const pattern = `%${search.trim().toLowerCase()}%`;
        const searchCondition = or(
          sql`unaccent(lower(${songs.title})) like unaccent(${pattern})`,
          sql`unaccent(lower(coalesce(${songs.artist}, ''))) like unaccent(${pattern})`,
          sql`unaccent(lower(coalesce(${songs.lyrics}, ''))) like unaccent(${pattern})`
        );
        if (searchCondition) whereConditions.push(searchCondition);
      }

      if (category) whereConditions.push(eq(songs.category, category));
      if (noLyrics) whereConditions.push(sql`coalesce(length(trim(${songs.lyrics})), 0) = 0`);

      if (missingLink === "youtube") whereConditions.push(NO_YOUTUBE);
      if (missingLink === "spotify") whereConditions.push(NO_SPOTIFY);

      const where = whereConditions.length ? and(...whereConditions) : undefined;

      const playCount = sql<number>`(select count(*)::int from event_songs es join events e on e.id = es.event_id where es.song_id = "songs"."id" and e.type <> 'template' and e.date <= now())`;
      const lastPlayed = sql<string | null>`(select max(e.date) from event_songs es join events e on e.id = es.event_id where es.song_id = "songs"."id" and e.type <> 'template' and e.date <= now())`;
      const titleOrder = sql`unaccent(lower(${songs.title}))`;

      const orderBy =
        sort === "title"
          ? [asc(titleOrder), asc(songs.id)]
          : sort === "mostPlayed"
            ? [desc(playCount), asc(titleOrder)]
            : sort === "leastPlayed"
              ? [asc(playCount), asc(titleOrder)]
              : [desc(songs.createdAt), desc(songs.id)];

      const [data, total] = await Promise.all([
        db.select({ ...getTableColumns(songs), playCount, lastPlayed })
          .from(songs)
          .where(where)
          .orderBy(...orderBy)
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(songs)
          .where(where),
      ]);

      const totalCount = total[0]?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        songs: data.map((row) => ({ ...row, lastPlayed: row.lastPlayed ? new Date(row.lastPlayed) : null })),
        total: totalCount,
        totalPages,
        currentPage: page,
        nextCursor: page < totalPages ? page + 1 : undefined,
      };
    }),

  facets: protectedProcedure.query(async () => {
    const [categories, [noLyrics], [noYoutube], [noSpotify]] = await Promise.all([
      db.selectDistinct({ category: songs.category }).from(songs),
      db.select({ count: count() }).from(songs).where(sql`coalesce(length(trim(${songs.lyrics})), 0) = 0`),
      db.select({ count: count() }).from(songs).where(NO_YOUTUBE),
      db.select({ count: count() }).from(songs).where(NO_SPOTIFY),
    ]);
    return {
      categories: categories.map((row) => row.category),
      noLyricsCount: noLyrics?.count ?? 0,
      noYoutubeCount: noYoutube?.count ?? 0,
      noSpotifyCount: noSpotify?.count ?? 0,
    };
  }),

  findLyrics: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(200), artist: z.string().max(200).optional() }))
    .mutation(async ({ input }) => findLyrics(input.title, input.artist ?? "")),

  spotifyTrack: protectedProcedure.input(z.string().min(1).max(40)).query(async ({ input }) => {
    if (!spotifyService.isConfigured()) return null;
    try {
      return await spotifyService.getTrack(input);
    } catch {
      return null;
    }
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

  merge: editSongs
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
          await syncSpotifyTrack(row.spotifyTrackId, null, row.id, warnings);
        }
      }
      return { merged: removed.length, warnings };
    }),

  create: editSongs.input(songSchema.extend({ allowDuplicate: z.boolean().optional() })).mutation(async ({ input: { allowDuplicate, ...input } }) => {
    if (!allowDuplicate) await assertNoDuplicate(input.title, input.artist);
    const warnings: string[] = [];

    const [youtube, spotify] = await Promise.all([
      resolveYouTube(input.youtubeUrl, input.title, input.artist, warnings),
      resolveSpotify(input.spotifyUrl, input.title, input.artist, warnings),
    ]);

    const [duration] = await Promise.all([
      input.duration ? Promise.resolve(input.duration) : durationFromVideo(youtube.youtubeVideoId, warnings),
      syncPlaylistVideo(null, input.skipPlaylist ? null : youtube.youtubeVideoId, undefined, warnings),
      syncSpotifyTrack(null, input.skipPlaylist ? null : spotify.spotifyTrackId, undefined, warnings),
    ]);

    const [song] = await db
      .insert(songs)
      .values(cleanEmptyStrings({ ...input, ...youtube, ...spotify, duration }))
      .returning();

    return { song, warnings };
  }),

  update: editSongs
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
        skipPlaylist: data.skipPlaylist,
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
      };

      const updateSpotify = async () => {
        const spotify = await resolveSpotify(data.spotifyUrl, title, artist, warnings);
        Object.assign(updateData, spotify);
      };

      await Promise.all([
        youtubeChanged ? updateYouTube() : Promise.resolve(),
        spotifyChanged ? updateSpotify() : Promise.resolve(),
      ]);

      const wasInPlaylist = !currentSong.skipPlaylist;
      const willBeInPlaylist = !(data.skipPlaylist ?? currentSong.skipPlaylist);
      const finalVideoId = "youtubeVideoId" in updateData ? (updateData.youtubeVideoId ?? null) : currentSong.youtubeVideoId;
      const finalTrackId = "spotifyTrackId" in updateData ? (updateData.spotifyTrackId ?? null) : currentSong.spotifyTrackId;
      await Promise.all([
        syncPlaylistVideo(wasInPlaylist ? currentSong.youtubeVideoId : null, willBeInPlaylist ? finalVideoId : null, currentSong.id, warnings),
        syncSpotifyTrack(wasInPlaylist ? currentSong.spotifyTrackId : null, willBeInPlaylist ? finalTrackId : null, currentSong.id, warnings),
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

  delete: editSongs.input(z.number()).mutation(async ({ input }) => {
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
      .returning({ youtubeVideoId: songs.youtubeVideoId, spotifyTrackId: songs.spotifyTrackId, skipPlaylist: songs.skipPlaylist });

    const warnings: string[] = [];
    if (deleted?.youtubeVideoId && !deleted.skipPlaylist) {
      await syncPlaylistVideo(deleted.youtubeVideoId, null, input, warnings);
    }
    if (deleted?.spotifyTrackId && !deleted.skipPlaylist) {
      await syncSpotifyTrack(deleted.spotifyTrackId, null, input, warnings);
    }
    return { success: true, warnings };
  }),

  getYouTubeStatus: protectedProcedure
    .input(z.object({ force: z.boolean().default(false) }).optional())
    .query(({ input }) => youtubeService.getStatus({ force: input?.force ?? false })),

  syncYouTubePlaylist: editSongs.mutation(async () => {
    let resolved = 0;
    let notFound = 0;
    let unresolvedLeft = 0;
    let unlinkedDead = 0;
    if (youtubeService.isConfigured()) {
      try {
        const linked = await db
          .select({ id: songs.id, videoId: songs.youtubeVideoId })
          .from(songs)
          .where(and(isNotNull(songs.youtubeVideoId), eq(songs.skipPlaylist, false)));
        const dead = await youtubeService.findUnavailable(linked.flatMap((row) => (row.videoId ? [row.videoId] : [])));
        for (const row of linked) {
          if (!row.videoId || !dead.has(row.videoId)) continue;
          await youtubeService.removeFromPlaylist(row.videoId).catch(() => false);
          await db
            .update(songs)
            .set({ youtubeUrl: null, youtubeVideoId: null, duration: null, updatedAt: new Date() })
            .where(eq(songs.id, row.id));
          unlinkedDead += 1;
        }
      } catch {
      }

      const unlinked = await db
        .select({ id: songs.id, title: songs.title, artist: songs.artist })
        .from(songs)
        .where(and(isNull(songs.youtubeVideoId), isNull(songs.youtubeUrl), eq(songs.skipPlaylist, false)))
        .orderBy(sql`random()`)
        .limit(YOUTUBE_RESOLVE_LIMIT + 1);
      const toResolve = unlinked.slice(0, YOUTUBE_RESOLVE_LIMIT);
      unresolvedLeft = unlinked.length - toResolve.length;
      for (const song of toResolve) {
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
        } catch {
          unresolvedLeft += toResolve.length - resolved - notFound;
          break;
        }
      }
    }

    const rows = await db
      .select({ id: songs.id, videoId: songs.youtubeVideoId, duration: songs.duration, skipPlaylist: songs.skipPlaylist })
      .from(songs)
      .where(isNotNull(songs.youtubeVideoId));

    const withVideo = rows.flatMap((row) => (row.videoId ? [{ ...row, videoId: row.videoId }] : []));

    try {
      const playlist = await youtubeService.syncPlaylist(withVideo.filter((row) => !row.skipPlaylist).map((row) => row.videoId));

      const missingDuration = withVideo.filter((row) => !row.duration);
      const durations = await youtubeService.getVideoDurations(missingDuration.map((row) => row.videoId));
      const updates = missingDuration.flatMap((row) => {
        const seconds = durations.get(row.videoId);
        return seconds ? [db.update(songs).set({ duration: seconds, updatedAt: new Date() }).where(eq(songs.id, row.id))] : [];
      });
      const [first, ...rest] = updates;
      if (first) await db.batch([first, ...rest]);

      return { ...playlist, durationsFilled: updates.length, unlinkedDead, resolved, notFound, unresolvedLeft };
    } catch (error) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: error instanceof Error ? error.message : "Falha ao sincronizar a playlist do YouTube",
      });
    }
  }),

  getSpotifyStatus: protectedProcedure.query(async () => spotifyService.getStatus(await getSpotifyPlaylistId())),

  syncSpotifyPlaylist: editSongs.mutation(async () => {
    const playlistId = await getSpotifyPlaylistId();
    if (!playlistId || !spotifyService.isConfigured()) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A integração com o Spotify não está configurada." });
    }

    try {
      const unlinked = await db
        .select({ id: songs.id, title: songs.title, artist: songs.artist })
        .from(songs)
        .where(sql`${songs.spotifyTrackId} is null and ${songs.spotifyUrl} is null`)
        .orderBy(asc(songs.id))
        .limit(SPOTIFY_RESOLVE_LIMIT + 1);
      const toResolve = unlinked.slice(0, SPOTIFY_RESOLVE_LIMIT);
      let resolved = 0;
      let notFound = 0;
      for (const song of toResolve) {
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

      const linked = await db
        .select({ trackId: songs.spotifyTrackId })
        .from(songs)
        .where(and(isNotNull(songs.spotifyTrackId), eq(songs.skipPlaylist, false)));
      const added = await spotifyService.addTracks(
        playlistId,
        linked.flatMap((row) => (row.trackId ? [row.trackId] : []))
      );

      return { resolved, notFound, added, remaining: unlinked.length - toResolve.length };
    } catch (error) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: error instanceof Error ? error.message : "Falha ao sincronizar a playlist do Spotify",
      });
    }
  }),
});

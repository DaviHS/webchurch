import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { can, createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { songs, eventSongs } from "@/server/db/schema";
import { songSchema, songCategories, type SongCategory } from "@/validators/song";
import { eq, asc, desc, and, or, sql, count, inArray, getTableColumns, type SQL } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";
import { songKey } from "@/lib/song-key";
import { findLyrics } from "@/lib/lyrics-search";
import { youtubeService } from "@/lib/youtube";
import { logError } from "@/server/log";
import { spotifyService } from "@/lib/spotify";
import { assertNoDuplicate, findDuplicate } from "@/server/songs/duplicates";
import { resolveDuration } from "@/server/songs/duration";
import {
  getSpotifyPlaylistId,
  resolveSpotify,
  resolveYouTube,
  syncPlaylistVideo,
  syncSongPlaylists,
  syncSpotifyTrack,
} from "@/server/songs/integrations";
import { syncSpotifyPlaylist } from "@/server/songs/spotify-sync";
import { planSongUpdate } from "@/server/songs/update";
import { syncYouTubePlaylist } from "@/server/songs/youtube-sync";

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
    } catch (error) {
      logError("spotify: faixa não carregada", error);
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
      input.duration ? Promise.resolve(input.duration) : resolveDuration(youtube.youtubeVideoId, spotify.spotifyTrackId, warnings),
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
      const warnings: string[] = [];

      const [current] = await db.select().from(songs).where(eq(songs.id, input.id));
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Música não encontrada" });

      const plan = await planSongUpdate(current, input.data, { allowDuplicate: input.allowDuplicate ?? false }, warnings);
      await syncSongPlaylists(
        current.id,
        { videoId: current.youtubeVideoId, trackId: current.spotifyTrackId, skipPlaylist: current.skipPlaylist },
        { videoId: plan.videoId, trackId: plan.trackId, skipPlaylist: plan.skipPlaylist },
        warnings,
      );

      const [song] = await db
        .update(songs)
        .set({ ...plan.changes, updatedAt: new Date() })
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

  syncYouTubePlaylist: editSongs.mutation(() => syncYouTubePlaylist()),

  getSpotifyStatus: protectedProcedure.query(async () => spotifyService.getStatus(await getSpotifyPlaylistId())),

  syncSpotifyPlaylist: editSongs.mutation(() => syncSpotifyPlaylist()),
});

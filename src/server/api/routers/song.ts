import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { songSchema } from "@/validators/song";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";
import { youtubeService } from "@/lib/youtube";

const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID || 'ID_PLAYLIST';

export const songRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const { search, category, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions: any[] = [];

      if (search && search.trim() !== "") {
        const sanitized = search.trim().toLowerCase();
        const searchLower = `%${sanitized}%`;

        whereConditions.push(
          or(
            sql`LOWER(${songs.title}) LIKE ${searchLower}`,
            sql`LOWER(${songs.artist}) LIKE ${searchLower}`
          )
        );
      }

      if (category) {
        whereConditions.push(eq(songs.category, category as any));
      }

      const [data, total] = await Promise.all([
        db.select()
          .from(songs)
          .where(whereConditions.length ? and(...whereConditions) : undefined)
          .orderBy(desc(songs.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: songs.id })
          .from(songs)
          .where(whereConditions.length ? and(...whereConditions) : undefined),
      ]);

      return {
        songs: data,
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / limit),
        currentPage: page,
      };
    }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const song = await db
      .select()
      .from(songs)
      .where(eq(songs.id, input))
      .then((res) => res[0]);
    return song || null;
  }),

  create: protectedProcedure.input(songSchema).mutation(async ({ input }) => {
    let youtubeVideoId: string | null = null;
    let finalYoutubeUrl = input.youtubeUrl;

    if (input.youtubeUrl) {
      youtubeVideoId = youtubeService.extractVideoId(input.youtubeUrl);
    } else {
      const videoId = await youtubeService.searchVideo(input.title, input.artist);
  
      if (videoId) {
        youtubeVideoId = videoId;
        finalYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    if (youtubeVideoId && YOUTUBE_PLAYLIST_ID) {
      try {
        const alreadyInPlaylist = await youtubeService.isVideoInPlaylist(
          youtubeVideoId, 
          YOUTUBE_PLAYLIST_ID
        );

        if (!alreadyInPlaylist) {
          await youtubeService.addToPlaylist(youtubeVideoId, YOUTUBE_PLAYLIST_ID);
        }
      } catch (error) {
        console.error('Erro ao gerenciar playlist:', error);
      }
    }

    const cleanedData = cleanEmptyStrings({
      ...input,
      youtubeUrl: finalYoutubeUrl,
      youtubeVideoId,
    });

    const [newSong] = await db.insert(songs).values(cleanedData).returning();
    return newSong;
  }),

   update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: songSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const currentSong = await db
        .select()
        .from(songs)
        .where(eq(songs.id, input.id))
        .then((res) => res[0]);

      if (!currentSong) {
        throw new Error("Música não encontrada");
      }

      let youtubeVideoId: string | null = null;
      let finalYoutubeUrl = input.data.youtubeUrl;

      const oldYoutubeVideoId = currentSong.youtubeVideoId;

      if (input.data.youtubeUrl) {
        youtubeVideoId = youtubeService.extractVideoId(input.data.youtubeUrl);
      } else if (input.data.title) {
        const videoId = await youtubeService.searchVideo(input.data.title, input.data.artist);
        if (videoId) {
          youtubeVideoId = videoId;
          finalYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      if (YOUTUBE_PLAYLIST_ID) {
        try {
          if (oldYoutubeVideoId && oldYoutubeVideoId !== youtubeVideoId) {
            const isOldVideoInPlaylist = await youtubeService.isVideoInPlaylist(
              oldYoutubeVideoId, 
              YOUTUBE_PLAYLIST_ID
            );
            
            if (isOldVideoInPlaylist) {
              await youtubeService.removeFromPlaylist(oldYoutubeVideoId, YOUTUBE_PLAYLIST_ID);
            }
          }

          if (youtubeVideoId) {
            const alreadyInPlaylist = await youtubeService.isVideoInPlaylist(
              youtubeVideoId, 
              YOUTUBE_PLAYLIST_ID
            );

            if (!alreadyInPlaylist) {
              await youtubeService.addToPlaylist(youtubeVideoId, YOUTUBE_PLAYLIST_ID);
            }
          }
        } catch (error) {
          console.error('Erro ao gerenciar playlist:', error);
        }
      }

      const cleanedData = cleanEmptyStrings({
        ...input.data,
        youtubeUrl: finalYoutubeUrl,
        youtubeVideoId,
      });

      const [updatedSong] = await db
        .update(songs)
        .set({ ...cleanedData, updatedAt: new Date() })
        .where(eq(songs.id, input.id))
        .returning();

      return updatedSong;
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.delete(songs).where(eq(songs.id, input));
    return { success: true };
  }),
});
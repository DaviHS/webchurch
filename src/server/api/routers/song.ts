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

    // Se tem URL do YouTube, extrai o ID do vídeo
    if (input.youtubeUrl) {
      youtubeVideoId = youtubeService.extractVideoId(input.youtubeUrl);
    } else {
      // Se não tem URL, busca automaticamente no YouTube
      const videoId = await youtubeService.searchVideo(input.title, input.artist);
      if (videoId) {
        youtubeVideoId = videoId;
        finalYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // Adiciona à playlist se encontrou o vídeo
    if (youtubeVideoId && YOUTUBE_PLAYLIST_ID) {
      try {
        await youtubeService.addToPlaylist(youtubeVideoId, YOUTUBE_PLAYLIST_ID);
        console.log(`Vídeo ${youtubeVideoId} adicionado à playlist ${YOUTUBE_PLAYLIST_ID}`);
      } catch (error) {
        console.error('Erro ao adicionar à playlist, mas a música será salva:', error);
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
      let youtubeVideoId: string | null = null;
      let finalYoutubeUrl = input.data.youtubeUrl;
      console.log(YOUTUBE_PLAYLIST_ID)
      // Lógica similar para atualização
      if (input.data.youtubeUrl) {
        youtubeVideoId = youtubeService.extractVideoId(input.data.youtubeUrl);
        
        // Se é uma URL nova e temos playlist, adiciona à playlist
        if (youtubeVideoId && YOUTUBE_PLAYLIST_ID) {
          try {
            await youtubeService.addToPlaylist(youtubeVideoId, YOUTUBE_PLAYLIST_ID);
          } catch (error) {
            console.error('Erro ao adicionar à playlist na atualização:', error);
          }
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
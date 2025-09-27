// server/api/routers/song.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { songSchema } from "@/validators/song";
import { eq, desc, like, and, or } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";

export const songRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { search, category, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = [];
      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        whereConditions.push(
          or(
            like(songs.title, searchLower),
            like(songs.artist, searchLower)
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
    const cleanedData = cleanEmptyStrings(input);
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
      const cleanedData = cleanEmptyStrings(input.data);
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
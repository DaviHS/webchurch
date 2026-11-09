import { z } from "zod";
import { subDays } from "date-fns";
import { and, count, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { events, eventSongs, songs } from "@/server/db/schema";

const notTemplate = ne(events.type, "template");

export const reportRouter = createTRPCRouter({
  getSongRanking: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      songIds: z.array(z.number()).optional(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate, songIds } = input;

      let startDateFilter: Date;
      let endDateFilter: Date;

      if (startDate && endDate) {
        startDateFilter = startDate;
        endDateFilter = endDate;
      } else {
        endDateFilter = new Date();
        startDateFilter = subDays(endDateFilter, 30);
      }

      const whereConditions = [
        gte(events.date, startDateFilter),
        lte(events.date, endDateFilter),
        notTemplate,
      ];

      if (songIds && songIds.length > 0) {
        whereConditions.push(inArray(eventSongs.songId, songIds));
      }

      const executions = count(eventSongs.songId);

      const query = db
        .select({
          songId: eventSongs.songId,
          title: songs.title,
          artist: songs.artist,
          count: executions,
          lastPlayed: sql<Date>`max(${events.date})`.mapWith((value: string | Date) => new Date(value)),
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .innerJoin(songs, eq(eventSongs.songId, songs.id))
        .where(and(...whereConditions))
        .groupBy(eventSongs.songId, songs.title, songs.artist)
        .orderBy(desc(executions));

      const result = await (!songIds || songIds.length === 0 ? query.limit(50) : query);
      return result;
    }),

  /** Execuções no período e no período anterior de mesma duração, para comparar. */
  comparePeriods: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date(), songIds: z.array(z.number()).optional() }))
    .query(async ({ input }) => {
      const length = input.endDate.getTime() - input.startDate.getTime();
      const previousEnd = new Date(input.startDate.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - length);

      const total = async (from: Date, to: Date) => {
        const conditions = [gte(events.date, from), lte(events.date, to), notTemplate];
        if (input.songIds && input.songIds.length > 0) conditions.push(inArray(eventSongs.songId, input.songIds));
        const [row] = await db
          .select({ total: count(eventSongs.id) })
          .from(eventSongs)
          .innerJoin(events, eq(eventSongs.eventId, events.id))
          .where(and(...conditions));
        return row?.total ?? 0;
      };

      const [current, previous] = await Promise.all([total(input.startDate, input.endDate), total(previousStart, previousEnd)]);
      return { current, previous, previousStart, previousEnd };
    }),

  /**
   * Músicas que não tocaram nenhuma vez no período escolhido (o mesmo filtro do relatório), das que estão há mais
   * tempo sem tocar para as mais recentes; as que nunca tocaram vêm numa lista à parte.
   */
  forgottenSongs: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date(), songIds: z.array(z.number()).optional() }))
    .query(async ({ input }) => {
      const lastPlayed = sql<Date | null>`max(case when ${events.type} <> 'template' and ${events.date} <= now() then ${events.date} end)`;
      const inPeriod = sql<number>`count(${eventSongs.id}) filter (where ${events.type} <> 'template' and ${events.date} >= ${input.startDate.toISOString()}::timestamp and ${events.date} <= ${input.endDate.toISOString()}::timestamp)`;
      const rows = await db
        .select({ id: songs.id, title: songs.title, artist: songs.artist, lastPlayed })
        .from(songs)
        .leftJoin(eventSongs, eq(eventSongs.songId, songs.id))
        .leftJoin(events, eq(eventSongs.eventId, events.id))
        .where(input.songIds && input.songIds.length > 0 ? inArray(songs.id, input.songIds) : undefined)
        .groupBy(songs.id, songs.title, songs.artist)
        .having(sql`${inPeriod} = 0`)
        .orderBy(sql`${lastPlayed} asc nulls last`, songs.title);
      const all = rows.map((row) => ({ ...row, lastPlayed: row.lastPlayed ? new Date(row.lastPlayed) : null }));
      // Duas listas separadas: assim as nunca tocadas não ficam escondidas atrás das muito antigas.
      return {
        forgotten: all.filter((song) => song.lastPlayed !== null),
        neverPlayed: all.filter((song) => song.lastPlayed === null),
      };
    }),

  getSongExecutions: protectedProcedure
    .input(z.object({
      songId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const { songId, startDate, endDate } = input;

      let startDateFilter: Date;
      let endDateFilter: Date;

      if (startDate && endDate) {
        startDateFilter = startDate;
        endDateFilter = endDate;
      } else if (endDate) {
        endDateFilter = endDate;
        startDateFilter = subDays(endDateFilter, 30);
      } else {
        endDateFilter = new Date();
        startDateFilter = subDays(endDateFilter, 30);
      }

      const results = await db
        .select({
          id: eventSongs.id,
          eventId: eventSongs.eventId,
          eventTitle: events.title,
          eventDate: events.date,
          eventType: events.type,
          order: eventSongs.order,
          notes: eventSongs.notes,
          songId: songs.id,
          songTitle: songs.title,
          songArtist: songs.artist,
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .innerJoin(songs, eq(eventSongs.songId, songs.id))
        .where(
          and(
            eq(eventSongs.songId, songId),
            gte(events.date, startDateFilter),
            lte(events.date, endDateFilter),
            notTemplate
          )
        )
        .orderBy(desc(events.date));

      return results;
    }),

  getRecentExecutions: protectedProcedure
    .input(z.object({
      songId: z.number(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      const { songId, limit } = input;

      const results = await db
        .select({
          id: eventSongs.id,
          eventId: eventSongs.eventId,
          eventTitle: events.title,
          eventDate: events.date,
          eventType: events.type,
          order: eventSongs.order,
          notes: eventSongs.notes,
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .where(
          and(
            eq(eventSongs.songId, songId),
            notTemplate
          )
        )
        .orderBy(desc(events.date))
        .limit(limit);

      return results;
    }),

  getSongStats: protectedProcedure
    .input(z.object({ songId: z.number() }))
    .query(async ({ input }) => {
      const stats = await db
        .select({
          totalExecutions: count(),
          firstExecution: sql<Date | null>`min(${events.date})`,
          lastExecution: sql<Date | null>`max(${events.date})`,
          averageOrder: sql<number | null>`avg(${eventSongs.order})`.mapWith(Number),
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .where(
          and(
            eq(eventSongs.songId, input.songId),
            notTemplate
          )
        );

      return stats[0];
    }),

  getSongTrend: protectedProcedure
    .input(z.object({
      songId: z.number(),
      days: z.number().min(1).default(30),
    }))
    .query(async ({ input }) => {
      const { songId, days } = input;
      const startDate = subDays(new Date(), days);

      const result = await db
        .select({
          date: events.date,
          count: count(eventSongs.songId),
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .where(
          and(
            eq(eventSongs.songId, songId),
            gte(events.date, startDate),
            notTemplate
          )
        )
        .groupBy(events.date)
        .orderBy(events.date);

      return result;
    }),
});

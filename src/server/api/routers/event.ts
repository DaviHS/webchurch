import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  events,
  eventSongs,
  eventParticipants,
  songs,
  members,
} from "@/server/db/schema";
import { eq, ne, desc, and, gte, lte, sql, ilike, inArray, or, count } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";
import { eventSchema, eventUpdateSchema, eventTypes, type EventType } from "@/validators/event";
import { subDays } from "date-fns";

const eventSongInputSchema = z.object({
  eventId: z.number(),
  songId: z.number(),
  order: z.number(),
  leaderId: z.number().optional(),
  notes: z.string().optional(),
});

const eventParticipantInputSchema = z.object({
  eventId: z.number(),
  memberId: z.number(),
  role: z.string().min(1, "Função é obrigatória"),
  instrument: z.string().optional(),
});

const notTemplate = ne(events.type, "template");

export const eventRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z
          .string()
          .optional()
          .transform((v) =>
            eventTypes.includes(v as EventType) ? (v as EventType) : undefined
          ),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, type, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = [];
      if (startDate) whereConditions.push(gte(events.date, startDate));
      if (endDate) whereConditions.push(lte(events.date, endDate));
      if (type) whereConditions.push(eq(events.type, type));
      if (search?.trim()) {
        const searchPattern = `%${search.trim()}%`;
        whereConditions.push(
          or(
            ilike(events.title, searchPattern),
            ilike(events.description, searchPattern),
            ilike(events.location, searchPattern)
          )
        );
      }

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [data, total] = await Promise.all([
        db.select()
          .from(events)
          .where(where)
          .orderBy(desc(events.date))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(events)
          .where(where),
      ]);

      const totalCount = total[0]?.count ?? 0;

      return {
        events: data,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, input))
      .then((res) => res[0]);

    if (!event) return null;

    const [songsList, participants] = await Promise.all([
      db
        .select({
          id: eventSongs.id,
          eventId: eventSongs.eventId,
          songId: eventSongs.songId,
          order: eventSongs.order,
          leaderId: eventSongs.leaderId,
          notes: eventSongs.notes,
          song: songs,
          leader: members,
        })
        .from(eventSongs)
        .where(eq(eventSongs.eventId, input))
        .leftJoin(songs, eq(eventSongs.songId, songs.id))
        .leftJoin(members, eq(eventSongs.leaderId, members.id))
        .orderBy(eventSongs.order),
      db
        .select({
          id: eventParticipants.id,
          eventId: eventParticipants.eventId,
          memberId: eventParticipants.memberId,
          role: eventParticipants.role,
          instrument: eventParticipants.instrument,
          member: members,
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, input))
        .leftJoin(members, eq(eventParticipants.memberId, members.id)),
    ]);

    return {
      ...event,
      songs: songsList,
      participants: participants,
    };
  }),

  create: protectedProcedure.input(eventSchema).mutation(async ({ input }) => {
    const processedData = {
      ...input,
      date: input.date instanceof Date ? input.date : new Date(input.date)
    };

    const cleanedData = cleanEmptyStrings(processedData);

    const [newEvent] = await db.insert(events).values(cleanedData).returning();
    return newEvent;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: eventUpdateSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { data } = input;

      const processedData = {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description === '' ? null : data.description,
        startTime: data.startTime === '' ? null : data.startTime,
        endTime: data.endTime === '' ? null : data.endTime,
        location: data.location === '' ? null : data.location,
        preacher: data.preacher === '' ? null : data.preacher,
        bibleVerse: data.bibleVerse === '' ? null : data.bibleVerse,
      };

      const updateData = Object.fromEntries(
        Object.entries(processedData).filter(([_, value]) => value !== undefined)
      );

      const [updatedEvent] = await db
        .update(events)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(events.id, input.id))
        .returning();

      if (!updatedEvent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });
      }

      return updatedEvent;
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.batch([
      db.delete(eventSongs).where(eq(eventSongs.eventId, input)),
      db.delete(eventParticipants).where(eq(eventParticipants.eventId, input)),
      db.delete(events).where(eq(events.id, input)),
    ]);
    return { success: true };
  }),

  addSong: protectedProcedure
    .input(eventSongInputSchema)
    .mutation(async ({ input }) => {
      const cleanedData = cleanEmptyStrings(input);
      const [eventSong] = await db.insert(eventSongs).values(cleanedData).returning();
      return eventSong;
    }),

  removeSong: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.delete(eventSongs).where(eq(eventSongs.id, input));
    return { success: true };
  }),

  addParticipant: protectedProcedure
    .input(eventParticipantInputSchema)
    .mutation(async ({ input }) => {
      const cleanedData = cleanEmptyStrings(input);
      const [participant] = await db.insert(eventParticipants).values(cleanedData).returning();
      return participant;
    }),

  removeParticipant: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.delete(eventParticipants).where(eq(eventParticipants.id, input));
    return { success: true };
  }),

  getSongsReport: protectedProcedure
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

  getLastExecutions: protectedProcedure
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

  getSongsTrend: protectedProcedure
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

  exportRepertoire: protectedProcedure
    .input(z.number())
    .query(async ({ input: eventId }) => {
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .then(res => res[0]);

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });
      }

      const [songsData, participantsData] = await Promise.all([
        db
          .select({
            eventSong: eventSongs,
            song: songs,
            leader: members,
          })
          .from(eventSongs)
          .where(eq(eventSongs.eventId, eventId))
          .leftJoin(songs, eq(eventSongs.songId, songs.id))
          .leftJoin(members, eq(eventSongs.leaderId, members.id))
          .orderBy(eventSongs.order),
        db
          .select({
            participant: eventParticipants,
            member: members,
          })
          .from(eventParticipants)
          .where(eq(eventParticipants.eventId, eventId))
          .leftJoin(members, eq(eventParticipants.memberId, members.id)),
      ]);

      return {
        event,
        songs: songsData,
        participants: participantsData,
      };
    }),

  getTemplates: protectedProcedure.query(async () => {
    const templateEvents = await db
      .select()
      .from(events)
      .where(eq(events.type, "template"))
      .orderBy(desc(events.createdAt));

    if (templateEvents.length === 0) return [];

    const songsList = await db
      .select({
        eventSong: eventSongs,
        song: songs,
        leader: members,
      })
      .from(eventSongs)
      .where(inArray(eventSongs.eventId, templateEvents.map((t) => t.id)))
      .leftJoin(songs, eq(eventSongs.songId, songs.id))
      .leftJoin(members, eq(eventSongs.leaderId, members.id))
      .orderBy(eventSongs.order);

    return templateEvents.map((template) => ({
      ...template,
      songs: songsList.filter((s) => s.eventSong.eventId === template.id),
    }));
  }),

  createTemplate: protectedProcedure.mutation(async () => {
    const [template] = await db
      .insert(events)
      .values({
        title: "Novo Template",
        type: "template",
        date: new Date(),
        description: "Template de evento personalizado",
      })
      .returning();

    return template;
  }),

  useTemplate: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: templateId }) => {
      const template = await db
        .select()
        .from(events)
        .where(eq(events.id, templateId))
        .then(res => res[0]);

      if (template?.type !== "template") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      const [newEvent] = await db
        .insert(events)
        .values({
          title: template.title + " (Cópia)",
          description: template.description,
          type: "cult",
          date: new Date(),
          startTime: template.startTime,
          endTime: template.endTime,
          location: template.location,
          preacher: template.preacher,
          bibleVerse: template.bibleVerse,
        })
        .returning();

      if (!newEvent) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar evento a partir do template" });
      }

      const templateSongs = await db
        .select()
        .from(eventSongs)
        .where(eq(eventSongs.eventId, templateId));

      if (templateSongs.length > 0) {
        await db.insert(eventSongs).values(
          templateSongs.map(song => ({
            eventId: newEvent.id,
            songId: song.songId,
            order: song.order,
            leaderId: song.leaderId,
            notes: song.notes,
          }))
        );
      }

      return newEvent;
    }),

  updateSongOrder: protectedProcedure
    .input(z.object({
      eventSongId: z.number(),
      newOrder: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { eventSongId, newOrder } = input;

      const [updatedSong] = await db
        .update(eventSongs)
        .set({ order: newOrder })
        .where(eq(eventSongs.id, eventSongId))
        .returning();

      return updatedSong;
    }),
});

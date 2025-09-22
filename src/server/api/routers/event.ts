import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  events,
  eventSongs,
  eventParticipants,
  songs,
  members,
} from "@/server/db/schema";
import { eq, desc, like, and, gte, lte, sql } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/clean";
import { eventSchema, eventUpdateSchema } from "@/validators/event";

// Schemas Zod atualizados
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

export const eventRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, type, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = [];
      if (startDate) whereConditions.push(gte(events.date, startDate));
      if (endDate) whereConditions.push(lte(events.date, endDate));
      if (type) whereConditions.push(eq(events.type, type as any));

      const [data, total] = await Promise.all([
        db.select()
          .from(events)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(desc(events.date))
          .limit(limit)
          .offset(offset),
        db.select({ count: events.id })
          .from(events)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined),
      ]);

      return {
        events: data,
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / limit),
        currentPage: page,
      };
    }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, input))
      .then((res) => res[0]);

    if (!event) return null;

    const [songsList, participants] = await Promise.all([
      db
        .select({
          eventSong: eventSongs,
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
          participant: eventParticipants,
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
    // Garantir que a data seja um objeto Date válido
    const processedData = {
      ...input,
      date: input.date instanceof Date ? input.date : new Date(input.date)
    };
    
    const cleanedData = cleanEmptyStrings(processedData);
    console.log("Data a ser inserida:", cleanedData);
    
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
    
    // Converter strings vazias para NULL explicitamente
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

    // Remover campos undefined (mantendo null para campos explicitamente vazios)
    const updateData = Object.fromEntries(
      Object.entries(processedData).filter(([_, value]) => value !== undefined)
    );

    console.log("Dados processados para update:", updateData);

    const [updatedEvent] = await db
      .update(events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, input.id))
      .returning();

    return updatedEvent;
  }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.delete(events).where(eq(events.id, input));
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

  getSongsReport: publicProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          songId: eventSongs.songId,
          title: songs.title,
          artist: songs.artist,
          count: sql<number>`count(${eventSongs.songId})`,
        })
        .from(eventSongs)
        .innerJoin(events, eq(eventSongs.eventId, events.id))
        .innerJoin(songs, eq(eventSongs.songId, songs.id))
        .where(gte(events.date, startDate))
        .groupBy(eventSongs.songId, songs.title, songs.artist)
        .orderBy(sql`count(${eventSongs.songId}) DESC`)
        .limit(20);

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
        throw new Error("Evento não encontrado");
      }

      const songsData = await db
        .select({
          eventSong: eventSongs,
          song: songs,
          leader: members,
        })
        .from(eventSongs)
        .where(eq(eventSongs.eventId, eventId))
        .leftJoin(songs, eq(eventSongs.songId, songs.id))
        .leftJoin(members, eq(eventSongs.leaderId, members.id))
        .orderBy(eventSongs.order);

      const participantsData = await db
        .select({
          participant: eventParticipants,
          member: members,
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
        .leftJoin(members, eq(eventParticipants.memberId, members.id));

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

    const templatesWithSongs = await Promise.all(
      templateEvents.map(async (template) => {
        const songsList = await db
          .select({
            eventSong: eventSongs,
            song: songs,
            leader: members,
          })
          .from(eventSongs)
          .where(eq(eventSongs.eventId, template.id))
          .leftJoin(songs, eq(eventSongs.songId, songs.id))
          .leftJoin(members, eq(eventSongs.leaderId, members.id))
          .orderBy(eventSongs.order);

        return { ...template, songs: songsList };
      })
    );

    return templatesWithSongs;
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

      if (!template || template.type !== "template") {
        throw new Error("Template não encontrado");
      }

      const [newEvent] = await db
        .insert(events)
        .values({
          title: template.title + " (Cópia)",
          description: template.description,
          type: "cult",
          date: new Date(),
          location: template.location,
          preacher: template.preacher,
          bibleVerse: template.bibleVerse,
        })
        .returning();

      const templateSongs = await db
        .select()
        .from(eventSongs)
        .where(eq(eventSongs.eventId, templateId));

      if (templateSongs.length > 0) {
        await db.insert(eventSongs).values(
          templateSongs.map(song => ({
            eventId: newEvent!.id,
            songId: song.songId,
            order: song.order,
            leaderId: song.leaderId,
            notes: song.notes,
          }))
        );
      }

      return newEvent;
    }),

    // No seu eventRouter, adicione esta mutation:
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
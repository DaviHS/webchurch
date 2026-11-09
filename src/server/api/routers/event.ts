import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { can, createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  events,
  eventSongs,
  eventPassages,
  eventParticipants,
  songs,
  members,
} from "@/server/db/schema";
import { endOfDay, startOfDay } from "date-fns";
import { asc, eq, getTableColumns, lt, ne, desc, and, gte, lte, ilike, inArray, or, count, sql } from "drizzle-orm";
import { cleanEmptyStrings } from "@/lib/formatters";
import { loadPassage } from "@/server/bible-passage";
import { spotifyService } from "@/lib/spotify";
import { deleteSetting, getSetting, setSetting } from "@/server/settings";

/**
 * Mantém a playlist do Spotify do evento igual ao repertório: chamada depois de adicionar, remover ou reordenar músicas.
 * Sem playlist criada, não faz nada. Se o Spotify falhar, o repertório já foi salvo: só registra o erro.
 */
async function syncEventPlaylist(eventId: number): Promise<void> {
  try {
    const playlist = await savedPlaylist(eventId);
    if (!playlist || !spotifyService.isConfigured()) return;
    const rows = await db
      .select({ trackId: songs.spotifyTrackId })
      .from(eventSongs)
      .innerJoin(songs, eq(eventSongs.songId, songs.id))
      .where(eq(eventSongs.eventId, eventId))
      .orderBy(asc(eventSongs.order), asc(eventSongs.id));
    await spotifyService.replacePlaylistTracks(playlist.id, rows.flatMap((row) => (row.trackId ? [row.trackId] : [])));
  } catch (error) {
    console.error("[spotify] não foi possível atualizar a playlist do evento:", error instanceof Error ? error.message : error);
  }
}

/** A playlist do Spotify de cada evento fica guardada nas configurações (sem coluna nova na tabela de eventos). */
const playlistKey = (eventId: number) => `event_spotify_playlist:${eventId}`;

async function savedPlaylist(eventId: number): Promise<{ id: string; url: string } | null> {
  const raw = await getSetting(playlistKey(eventId));
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { id?: string; url?: string };
    return data.id && data.url ? { id: data.id, url: data.url } : null;
  } catch {
    return null;
  }
}
import { eventSchema, eventUpdateSchema, eventTypes, type EventType } from "@/validators/event";

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

const editEvents = can("events.edit");

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
        /** "upcoming": de hoje em diante, do mais próximo ao mais distante. "past": antes de hoje, do mais recente. */
        scope: z.enum(["upcoming", "past"]).optional(),
        /** Início do dia de hoje no aparelho de quem consulta (evita depender do fuso do servidor). */
        today: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, type, search, scope, today, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = [];
      if (startDate) whereConditions.push(gte(events.date, startDate));
      if (endDate) whereConditions.push(lte(events.date, endDate));
      if (type) whereConditions.push(eq(events.type, type));
      const startOfToday = today ?? startOfDay(new Date());
      if (scope === "upcoming") whereConditions.push(gte(events.date, startOfToday), ne(events.type, "template"));
      if (scope === "past") whereConditions.push(lt(events.date, startOfToday), ne(events.type, "template"));
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
        db.select({
            ...getTableColumns(events),
            // Com uma tabela só, o Drizzle escreve "id" sem o nome da tabela, o que apontaria para event_songs.id.
            // Por isso o texto fixo "events"."id".
            songCount: sql<number>`(select count(*)::int from event_songs where event_songs.event_id = "events"."id")`,
            noLyricsCount: sql<number>`(select count(*)::int from event_songs es join songs s on s.id = es.song_id where es.event_id = "events"."id" and coalesce(length(trim(s.lyrics)), 0) = 0)`,
            passageCount: sql<number>`(select count(*)::int from event_passages where event_passages.event_id = "events"."id")`,
          })
          .from(events)
          .where(where)
          .orderBy(...(scope === "upcoming" ? [asc(events.date), asc(events.id)] : [desc(events.date), desc(events.id)]))
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

  /** Tipos de evento que existem no escopo (próximos ou passados), para mostrar só os filtros que servem. */
  typesInScope: protectedProcedure
    .input(z.object({ scope: z.enum(["upcoming", "past"]), today: z.date().optional() }))
    .query(async ({ input }) => {
      const startOfToday = input.today ?? startOfDay(new Date());
      const rows = await db
        .selectDistinct({ type: events.type })
        .from(events)
        .where(and(ne(events.type, "template"), input.scope === "upcoming" ? gte(events.date, startOfToday) : lt(events.date, startOfToday)));
      return rows.map((row) => row.type);
    }),

  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, input))
      .then((res) => res[0]);

    if (!event) return null;

    const [songsList, participants, passages] = await Promise.all([
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
      db
        .select()
        .from(eventPassages)
        .where(eq(eventPassages.eventId, input))
        .orderBy(eventPassages.order, eventPassages.id),
    ]);

    return {
      ...event,
      songs: songsList,
      participants: participants,
      passages,
    };
  }),

  create: editEvents.input(eventSchema).mutation(async ({ input }) => {
    const processedData = {
      ...input,
      date: input.date instanceof Date ? input.date : new Date(input.date)
    };

    const cleanedData = cleanEmptyStrings(processedData);

    const [newEvent] = await db.insert(events).values(cleanedData).returning();
    return newEvent;
  }),

  update: editEvents
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

  delete: editEvents.input(z.number()).mutation(async ({ input }) => {
    await db.batch([
      db.delete(eventSongs).where(eq(eventSongs.eventId, input)),
      db.delete(eventParticipants).where(eq(eventParticipants.eventId, input)),
      db.delete(events).where(eq(events.id, input)),
    ]);
    await deleteSetting(playlistKey(input));
    return { success: true };
  }),

  addSong: editEvents
    .input(eventSongInputSchema)
    .mutation(async ({ input }) => {
      const cleanedData = cleanEmptyStrings(input);
      const [eventSong] = await db.insert(eventSongs).values(cleanedData).returning();
      await syncEventPlaylist(input.eventId);
      return eventSong;
    }),

  /** Grava a nova ordem do repertório de uma vez (1, 2, 3…), para não ficar pela metade se uma chamada falhar. */
  reorderSongs: editEvents
    .input(z.object({ eventId: z.number(), orderedIds: z.array(z.number()).min(1).max(200) }))
    .mutation(async ({ input }) => {
      const [first, ...rest] = input.orderedIds.map((id, index) =>
        db
          .update(eventSongs)
          .set({ order: index + 1 })
          .where(and(eq(eventSongs.id, id), eq(eventSongs.eventId, input.eventId))),
      );
      if (first) await db.batch([first, ...rest]);
      await syncEventPlaylist(input.eventId);
      return { success: true };
    }),

  /** Coloca uma música no fim do repertório do evento (usado pelos relatórios, sem precisar abrir o evento). */
  addSongToEnd: editEvents
    .input(z.object({ eventId: z.number(), songId: z.number() }))
    .mutation(async ({ input }) => {
      const current = await db
        .select({ songId: eventSongs.songId, order: eventSongs.order })
        .from(eventSongs)
        .where(eq(eventSongs.eventId, input.eventId));
      if (current.some((item) => item.songId === input.songId)) {
        throw new TRPCError({ code: "CONFLICT", message: "Esta música já está no repertório do evento." });
      }
      const order = current.reduce((max, item) => Math.max(max, item.order), 0) + 1;
      const [added] = await db.insert(eventSongs).values({ eventId: input.eventId, songId: input.songId, order }).returning();
      await syncEventPlaylist(input.eventId);
      return added;
    }),

  addPassage: editEvents
    .input(
      z.object({
        eventId: z.number().int().positive(),
        reference: z.string().trim().min(2).max(60),
        versionCode: z.string().min(1).max(10),
        placement: z.enum(["before", "after"]),
      })
    )
    .mutation(async ({ input }) => {
      const passage = await loadPassage(input.versionCode, input.reference);
      const [last] = await db
        .select({ max: sql<number | null>`max(${eventPassages.order})` })
        .from(eventPassages)
        .where(eq(eventPassages.eventId, input.eventId));
      const [created] = await db
        .insert(eventPassages)
        .values({
          eventId: input.eventId,
          reference: passage.title,
          versionCode: passage.version.code,
          placement: input.placement,
          order: (last?.max ?? 0) + 1,
        })
        .returning();
      return created;
    }),

  removePassage: editEvents.input(z.number()).mutation(async ({ input }) => {
    await db.delete(eventPassages).where(eq(eventPassages.id, input));
    return { success: true };
  }),

  removeSong: editEvents.input(z.number()).mutation(async ({ input }) => {
    const [removed] = await db.delete(eventSongs).where(eq(eventSongs.id, input)).returning({ eventId: eventSongs.eventId });
    if (!removed) return { success: true };

    // As demais músicas sobem para fechar o buraco: a ordem volta a ser 1, 2, 3...
    const remaining = await db
      .select({ id: eventSongs.id, order: eventSongs.order })
      .from(eventSongs)
      .where(eq(eventSongs.eventId, removed.eventId))
      .orderBy(asc(eventSongs.order), asc(eventSongs.id));
    const changes = remaining.flatMap((row, index) => (row.order === index + 1 ? [] : [{ id: row.id, order: index + 1 }]));
    const [first, ...rest] = changes.map(({ id, order }) => db.update(eventSongs).set({ order }).where(eq(eventSongs.id, id)));
    if (first) await db.batch([first, ...rest]);
    await syncEventPlaylist(removed.eventId);
    return { success: true };
  }),

  addParticipant: editEvents
    .input(eventParticipantInputSchema)
    .mutation(async ({ input }) => {
      const cleanedData = cleanEmptyStrings(input);
      const [participant] = await db.insert(eventParticipants).values(cleanedData).returning();
      return participant;
    }),

  removeParticipant: editEvents.input(z.number()).mutation(async ({ input }) => {
    await db.delete(eventParticipants).where(eq(eventParticipants.id, input));
    return { success: true };
  }),

  /** A playlist do Spotify já criada para o evento, se houver. */
  spotifyPlaylist: protectedProcedure.input(z.number()).query(({ input }) => savedPlaylist(input)),

  /** Exclui a playlist do Spotify criada para o evento. */
  deleteSpotifyPlaylist: editEvents.input(z.number()).mutation(async ({ input: eventId }) => {
    const playlist = await savedPlaylist(eventId);
    if (!playlist) return { deleted: false };
    try {
      await spotifyService.deletePlaylist(playlist.id);
    } catch (error) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: error instanceof Error ? error.message : "Não foi possível excluir a playlist no Spotify.",
      });
    }
    await deleteSetting(playlistKey(eventId));
    return { deleted: true };
  }),

  /** Cria no Spotify uma playlist com o repertório do evento, na ordem do culto. Músicas sem faixa ficam de fora. */
  createSpotifyPlaylist: editEvents
    .input(z.object({ eventId: z.number(), name: z.string().trim().min(1).max(100) }))
    .mutation(async ({ input }) => {
      if (!spotifyService.isConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A integração com o Spotify não está configurada." });
      }
      if (await savedPlaylist(input.eventId)) {
        throw new TRPCError({ code: "CONFLICT", message: "Este evento já tem uma playlist. Exclua a atual para criar outra." });
      }
      const rows = await db
        .select({ title: songs.title, artist: songs.artist, trackId: songs.spotifyTrackId })
        .from(eventSongs)
        .innerJoin(songs, eq(eventSongs.songId, songs.id))
        .where(eq(eventSongs.eventId, input.eventId))
        .orderBy(asc(eventSongs.order));
      if (rows.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Este evento não tem músicas." });

      const trackIds = rows.flatMap((row) => (row.trackId ? [row.trackId] : []));
      const missing = rows.filter((row) => !row.trackId).map((row) => (row.artist ? `${row.title} (${row.artist})` : row.title));
      if (trackIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma música deste repertório tem faixa vinculada ao Spotify." });
      }
      try {
        const playlist = await spotifyService.createPlaylist(input.name, "Repertório gerado pelo sistema da igreja.", trackIds);
        await setSetting(playlistKey(input.eventId), JSON.stringify({ id: playlist.id, url: playlist.url }));
        return { url: playlist.url, added: playlist.added, missing };
      } catch (error) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: error instanceof Error ? error.message : "Não foi possível criar a playlist no Spotify.",
        });
      }
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

  createTemplate: editEvents.mutation(async () => {
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

  createFromTemplate: editEvents
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

      const templatePassages = await db.select().from(eventPassages).where(eq(eventPassages.eventId, templateId));
      if (templatePassages.length > 0) {
        await db.insert(eventPassages).values(
          templatePassages.map((passage) => ({
            eventId: newEvent.id,
            reference: passage.reference,
            versionCode: passage.versionCode,
            placement: passage.placement,
            order: passage.order,
          }))
        );
      }

      return newEvent;
    }),

  /**
   * Copia um evento (músicas e passagens) para o próximo mesmo dia da semana livre: um culto de domingo vai para o
   * próximo domingo, a partir de hoje, que ainda não tenha um evento do mesmo tipo.
   */
  duplicate: editEvents.input(z.number()).mutation(async ({ input }) => {
    const [source] = await db.select().from(events).where(eq(events.id, input));
    if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });

    const nextDate = new Date(source.date);
    nextDate.setDate(nextDate.getDate() + 7);
    const today = startOfDay(new Date());
    for (let attempt = 0; attempt < 104; attempt++) {
      if (nextDate >= today) {
        const sameDay = await db
          .select({ id: events.id })
          .from(events)
          .where(and(eq(events.type, source.type), gte(events.date, startOfDay(nextDate)), lte(events.date, endOfDay(nextDate))))
          .limit(1);
        if (sameDay.length === 0) break;
      }
      nextDate.setDate(nextDate.getDate() + 7);
    }
    const [copy] = await db
      .insert(events)
      .values({
        title: source.title,
        description: source.description,
        type: source.type,
        date: nextDate,
        startTime: source.startTime,
        endTime: source.endTime,
        location: source.location,
        preacher: null,
        bibleVerse: null,
      })
      .returning();
    if (!copy) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao duplicar o evento" });

    const sourceSongs = await db.select().from(eventSongs).where(eq(eventSongs.eventId, source.id)).orderBy(asc(eventSongs.order));
    if (sourceSongs.length > 0) {
      await db.insert(eventSongs).values(
        sourceSongs.map((song) => ({ eventId: copy.id, songId: song.songId, order: song.order, leaderId: song.leaderId, notes: song.notes })),
      );
    }
    const sourcePassages = await db.select().from(eventPassages).where(eq(eventPassages.eventId, source.id));
    if (sourcePassages.length > 0) {
      await db.insert(eventPassages).values(
        sourcePassages.map((passage) => ({
          eventId: copy.id,
          reference: passage.reference,
          versionCode: passage.versionCode,
          placement: passage.placement,
          order: passage.order,
        })),
      );
    }
    return copy;
  }),

  updateSongOrder: editEvents
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

      if (updatedSong) await syncEventPlaylist(updatedSong.eventId);
      return updatedSong;
    }),
});

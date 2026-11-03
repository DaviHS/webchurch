import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { events, eventSongs, songs } from "@/server/db/schema";

const deckSongColumns = {
  id: songs.id,
  title: songs.title,
  artist: songs.artist,
  lyrics: songs.lyrics,
};

export const presentationRouter = createTRPCRouter({
  getDeck: protectedProcedure
    .input(
      z.union([
        z.object({ eventId: z.number().int().positive() }),
        z.object({ songId: z.number().int().positive() }),
      ])
    )
    .query(async ({ input }) => {
      if ("songId" in input) {
        const [song] = await db
          .select(deckSongColumns)
          .from(songs)
          .where(eq(songs.id, input.songId))
          .limit(1);

        if (!song) throw new TRPCError({ code: "NOT_FOUND", message: "Música não encontrada" });

        return { key: `song-${song.id}`, title: song.title, subtitle: song.artist, date: null, songs: [song] };
      }

      const [event] = await db
        .select({ id: events.id, title: events.title, date: events.date })
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });

      const setlist = await db
        .select(deckSongColumns)
        .from(eventSongs)
        .innerJoin(songs, eq(eventSongs.songId, songs.id))
        .where(eq(eventSongs.eventId, event.id))
        .orderBy(asc(eventSongs.order), asc(eventSongs.id));

      return { key: `event-${event.id}`, title: event.title, subtitle: null, date: event.date, songs: setlist };
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { events, eventPassages, eventSongs, songs } from "@/server/db/schema";
import { loadPassage } from "@/server/bible-passage";

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
        z.object({ bible: z.literal(true) }),
      ])
    )
    .query(async ({ input }) => {
      if ("bible" in input) {
        return { key: "bible", title: "Bíblia", subtitle: "Passagens bíblicas", date: null, songs: [] };
      }

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

      const savedPassages = await db
        .select({ reference: eventPassages.reference, versionCode: eventPassages.versionCode, placement: eventPassages.placement })
        .from(eventPassages)
        .where(eq(eventPassages.eventId, event.id))
        .orderBy(asc(eventPassages.order), asc(eventPassages.id));

      const loaded = await Promise.all(
        savedPassages.map((saved) =>
          loadPassage(saved.versionCode, saved.reference).then(
            (passage) => ({ placement: saved.placement === "before" ? ("before" as const) : ("after" as const), passage }),
            () => null,
          ),
        ),
      );
      const passages = loaded.filter((item) => item !== null);

      return { key: `event-${event.id}`, title: event.title, subtitle: null, date: event.date, songs: setlist, passages };
    }),
});

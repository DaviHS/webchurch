import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { bibleMarks, bibleVerses, bibleVersions, users } from "@/server/db/schema";
import { BIBLE_MARK_COLOR_VALUES, MAX_NOTE_LENGTH } from "@/lib/bible-marks";
import { getBook } from "@/lib/bible";
import { findVersion } from "@/server/bible-passage";

const verseLocation = z.object({
  bookId: z.number().int().min(1).max(66),
  chapter: z.number().int().min(1).max(150),
});

const userIdOf = (ctx: { session: { user: { id?: string } } }) => {
  const id = Number(ctx.session.user.id);
  if (!Number.isInteger(id)) throw new TRPCError({ code: "UNAUTHORIZED" });
  return id;
};

const markTarget = [bibleMarks.userId, bibleMarks.bookId, bibleMarks.chapter, bibleMarks.verse];

async function resolveVersion(preferredCode: string | null | undefined) {
  if (preferredCode) {
    const [preferred] = await db
      .select({ id: bibleVersions.id, code: bibleVersions.code })
      .from(bibleVersions)
      .where(and(eq(bibleVersions.code, preferredCode), eq(bibleVersions.isActive, true)))
      .limit(1);
    if (preferred) return preferred;
  }
  const [first] = await db
    .select({ id: bibleVersions.id, code: bibleVersions.code })
    .from(bibleVersions)
    .where(eq(bibleVersions.isActive, true))
    .orderBy(asc(bibleVersions.id))
    .limit(1);
  return first;
}

export const biblePersonalProcedures = {
  preferences: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ version: users.bibleVersion, bookId: users.bibleBook, chapter: users.bibleChapter })
      .from(users)
      .where(eq(users.id, userIdOf(ctx)))
      .limit(1);
    return row ?? { version: null, bookId: null, chapter: null };
  }),

  savePreferences: protectedProcedure
    .input(
      z
        .object({ version: z.string().min(1).max(10).optional(), location: verseLocation.optional() })
        .refine((value) => value.version !== undefined || value.location !== undefined, "Nada para salvar"),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.version) await findVersion(input.version);
      const book = input.location ? getBook(input.location.bookId) : undefined;
      if (input.location && (!book || input.location.chapter > book.chapters)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Capítulo inválido" });
      }
      await db
        .update(users)
        .set({
          ...(input.version ? { bibleVersion: input.version } : {}),
          ...(input.location ? { bibleBook: input.location.bookId, bibleChapter: input.location.chapter } : {}),
        })
        .where(eq(users.id, userIdOf(ctx)));
      return { success: true };
    }),

  chapterMarks: protectedProcedure.input(verseLocation).query(({ ctx, input }) =>
    db
      .select({ verse: bibleMarks.verse, color: bibleMarks.color, note: bibleMarks.note })
      .from(bibleMarks)
      .where(and(eq(bibleMarks.userId, userIdOf(ctx)), eq(bibleMarks.bookId, input.bookId), eq(bibleMarks.chapter, input.chapter)))
      .orderBy(asc(bibleMarks.verse)),
  ),

  setMarks: protectedProcedure
    .input(
      verseLocation.extend({
        verses: z.array(z.number().int().min(1).max(200)).min(1).max(200),
        color: z.enum(BIBLE_MARK_COLOR_VALUES).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = userIdOf(ctx);
      const verses = [...new Set(input.verses)];
      if (input.color) {
        await db
          .insert(bibleMarks)
          .values(verses.map((verse) => ({ userId, bookId: input.bookId, chapter: input.chapter, verse, color: input.color })))
          .onConflictDoUpdate({ target: markTarget, set: { color: sql`excluded.color`, updatedAt: new Date() } });
        return { success: true };
      }
      const here = and(
        eq(bibleMarks.userId, userId),
        eq(bibleMarks.bookId, input.bookId),
        eq(bibleMarks.chapter, input.chapter),
        inArray(bibleMarks.verse, verses),
      );
      await db.batch([
        db.update(bibleMarks).set({ color: null, updatedAt: new Date() }).where(here),
        db.delete(bibleMarks).where(and(here, isNull(bibleMarks.color), isNull(bibleMarks.note))),
      ]);
      return { success: true };
    }),

  setNote: protectedProcedure
    .input(verseLocation.extend({ verse: z.number().int().min(1).max(200), note: z.string().trim().max(MAX_NOTE_LENGTH) }))
    .mutation(async ({ ctx, input }) => {
      const userId = userIdOf(ctx);
      if (input.note) {
        await db
          .insert(bibleMarks)
          .values({ userId, bookId: input.bookId, chapter: input.chapter, verse: input.verse, note: input.note })
          .onConflictDoUpdate({ target: markTarget, set: { note: input.note, updatedAt: new Date() } });
        return { success: true };
      }
      const here = and(
        eq(bibleMarks.userId, userId),
        eq(bibleMarks.bookId, input.bookId),
        eq(bibleMarks.chapter, input.chapter),
        eq(bibleMarks.verse, input.verse),
      );
      await db.batch([
        db.update(bibleMarks).set({ note: null, updatedAt: new Date() }).where(here),
        db.delete(bibleMarks).where(and(here, isNull(bibleMarks.color), isNull(bibleMarks.note))),
      ]);
      return { success: true };
    }),

  myMarks: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
        color: z.enum(BIBLE_MARK_COLOR_VALUES).optional(),
        onlyNotes: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = userIdOf(ctx);
      const [prefs] = await db.select({ version: users.bibleVersion }).from(users).where(eq(users.id, userId)).limit(1);
      const version = await resolveVersion(prefs?.version);

      const where = and(
        eq(bibleMarks.userId, userId),
        input.color ? eq(bibleMarks.color, input.color) : undefined,
        input.onlyNotes ? isNotNull(bibleMarks.note) : undefined,
      );

      const [items, [total]] = await Promise.all([
        db
          .select({
            bookId: bibleMarks.bookId,
            chapter: bibleMarks.chapter,
            verse: bibleMarks.verse,
            color: bibleMarks.color,
            note: bibleMarks.note,
            updatedAt: bibleMarks.updatedAt,
            text: bibleVerses.text,
          })
          .from(bibleMarks)
          .leftJoin(
            bibleVerses,
            and(
              eq(bibleVerses.versionId, version?.id ?? -1),
              eq(bibleVerses.bookId, bibleMarks.bookId),
              eq(bibleVerses.chapter, bibleMarks.chapter),
              eq(bibleVerses.verse, bibleMarks.verse),
            ),
          )
          .where(where)
          .orderBy(desc(bibleMarks.updatedAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db.select({ value: count() }).from(bibleMarks).where(where),
      ]);
      const totalItems = total?.value ?? 0;
      return {
        version: version?.code ?? null,
        items,
        total: totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / input.limit)),
      };
    }),
};

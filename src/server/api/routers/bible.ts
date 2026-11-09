import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { bibleHeadings, bibleVerses, bibleVersions } from "@/server/db/schema";
import { getBook } from "@/lib/bible";
import { cleanVerses, findVersion, loadPassage } from "@/server/bible-passage";
import { biblePersonalProcedures } from "@/server/api/routers/bible-personal";
import { bibleReadingPlanProcedures } from "@/server/api/routers/bible-plan";

const versionCode = z.string().min(1).max(10);

export const bibleRouter = createTRPCRouter({
  ...biblePersonalProcedures,
  ...bibleReadingPlanProcedures,

  versions: protectedProcedure.query(() =>
    db
      .select({ id: bibleVersions.id, code: bibleVersions.code, name: bibleVersions.name, language: bibleVersions.language })
      .from(bibleVersions)
      .where(eq(bibleVersions.isActive, true))
      .orderBy(asc(bibleVersions.id)),
  ),

  getChapter: protectedProcedure
    .input(z.object({ version: versionCode, bookId: z.number().int().min(1).max(66), chapter: z.number().int().min(1).max(150) }))
    .query(async ({ input }) => {
      const book = getBook(input.bookId);
      if (!book || input.chapter > book.chapters) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Capítulo não encontrado" });
      }
      const version = await findVersion(input.version);
      const verses = await db
        .select({ verse: bibleVerses.verse, text: bibleVerses.text })
        .from(bibleVerses)
        .where(
          and(
            eq(bibleVerses.versionId, version.id),
            eq(bibleVerses.bookId, input.bookId),
            eq(bibleVerses.chapter, input.chapter),
          ),
        )
        .orderBy(asc(bibleVerses.verse));
      if (verses.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Capítulo não encontrado nesta versão" });
      const headings = await db
        .select({ verse: bibleHeadings.verse, title: bibleHeadings.title })
        .from(bibleHeadings)
        .where(
          and(
            eq(bibleHeadings.versionId, version.id),
            eq(bibleHeadings.bookId, input.bookId),
            eq(bibleHeadings.chapter, input.chapter),
          ),
        )
        .orderBy(asc(bibleHeadings.verse));
      return { version, bookId: input.bookId, chapter: input.chapter, verses: cleanVerses(verses), headings };
    }),

  getPassage: protectedProcedure
    .input(z.object({ version: versionCode, reference: z.string().min(2).max(60) }))
    .query(({ input }) => loadPassage(input.version, input.reference)),

  search: protectedProcedure
    .input(
      z.object({
        version: versionCode,
        query: z.string().trim().min(2).max(100),
        scope: z.enum(["all", "ot", "nt"]).default("all"),
        limit: z.number().int().min(1).max(200).default(30),
      }),
    )
    .query(async ({ input }) => {
      const version = await findVersion(input.version);
      const config = sql.raw(version.language === "pt" ? "'portuguese'" : "'english'");
      // unaccent nos dois lados: "pao" encontra "pão".
      const match = sql`to_tsvector(${config}, unaccent(${bibleVerses.text})) @@ websearch_to_tsquery(${config}, unaccent(${input.query}))`;
      const scope =
        input.scope === "ot" ? lte(bibleVerses.bookId, 39) : input.scope === "nt" ? gte(bibleVerses.bookId, 40) : undefined;
      const rows = await db
        .select({
          bookId: bibleVerses.bookId,
          chapter: bibleVerses.chapter,
          verse: bibleVerses.verse,
          text: bibleVerses.text,
        })
        .from(bibleVerses)
        .where(and(eq(bibleVerses.versionId, version.id), scope, match))
        .orderBy(asc(bibleVerses.bookId), asc(bibleVerses.chapter), asc(bibleVerses.verse))
        .limit(input.limit + 1);
      return { hits: rows.slice(0, input.limit), hasMore: rows.length > input.limit };
    }),
});

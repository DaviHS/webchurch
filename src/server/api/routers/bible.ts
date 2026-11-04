import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { bibleVerses, bibleVersions } from "@/server/db/schema";
import { formatReference, getBook, parseReference } from "@/lib/bible";

async function findVersion(code: string) {
  const [version] = await db
    .select({ id: bibleVersions.id, code: bibleVersions.code, name: bibleVersions.name, language: bibleVersions.language })
    .from(bibleVersions)
    .where(and(eq(bibleVersions.code, code), eq(bibleVersions.isActive, true)))
    .limit(1);
  if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão da Bíblia não encontrada" });
  return version;
}

const versionCode = z.string().min(1).max(10);

export const bibleRouter = createTRPCRouter({
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
      return { version, bookId: input.bookId, chapter: input.chapter, verses };
    }),

  getPassage: protectedProcedure
    .input(z.object({ version: versionCode, reference: z.string().min(2).max(60) }))
    .query(async ({ input }) => {
      const ref = parseReference(input.reference);
      if (!ref) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Referência inválida. Exemplo: Jo 3:16-18" });
      }
      const version = await findVersion(input.version);
      const conditions = [
        eq(bibleVerses.versionId, version.id),
        eq(bibleVerses.bookId, ref.book.id),
        eq(bibleVerses.chapter, ref.chapter),
      ];
      if (ref.verseStart !== null) conditions.push(gte(bibleVerses.verse, ref.verseStart));
      if (ref.verseEnd !== null) conditions.push(lte(bibleVerses.verse, ref.verseEnd));

      const verses = await db
        .select({ verse: bibleVerses.verse, text: bibleVerses.text })
        .from(bibleVerses)
        .where(and(...conditions))
        .orderBy(asc(bibleVerses.verse));
      if (verses.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: `${formatReference(ref)} não existe em ${version.code}` });
      }

      return {
        title: formatReference(ref),
        bookChapter: `${ref.book.namePt} ${ref.chapter}`,
        version: { code: version.code, name: version.name },
        verses,
      };
    }),

  search: protectedProcedure
    .input(z.object({ version: versionCode, query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(50).default(30) }))
    .query(async ({ input }) => {
      const version = await findVersion(input.version);
      const config = sql.raw(version.language === "pt" ? "'portuguese'" : "'english'");
      return db
        .select({
          bookId: bibleVerses.bookId,
          chapter: bibleVerses.chapter,
          verse: bibleVerses.verse,
          text: bibleVerses.text,
        })
        .from(bibleVerses)
        .where(
          and(
            eq(bibleVerses.versionId, version.id),
            sql`to_tsvector(${config}, ${bibleVerses.text}) @@ websearch_to_tsquery(${config}, ${input.query})`,
          ),
        )
        .orderBy(asc(bibleVerses.bookId), asc(bibleVerses.chapter), asc(bibleVerses.verse))
        .limit(input.limit);
    }),
});

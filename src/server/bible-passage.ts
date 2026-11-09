import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import { bibleVerses, bibleVersions } from "@/server/db/schema";
import { formatReference, parseReference } from "@/lib/bible";

/**
 * Algumas fontes (a ACF importada, por exemplo) trazem "Verszeile ohne Text" em versículos cujo texto já está
 * junto do versículo anterior. Mostramos um aviso em português no lugar do texto de marcação.
 */
const EMPTY_VERSE = /^s*Verszeile ohne Texts*$/i;
export const EMPTY_VERSE_NOTE = "(texto reunido ao versículo anterior)";

export const cleanVerses = <T extends { text: string }>(verses: T[]): T[] =>
  verses.map((verse) => (EMPTY_VERSE.test(verse.text) ? { ...verse, text: EMPTY_VERSE_NOTE } : verse));

export async function findVersion(code: string) {
  const [version] = await db
    .select({ id: bibleVersions.id, code: bibleVersions.code, name: bibleVersions.name, language: bibleVersions.language })
    .from(bibleVersions)
    .where(and(eq(bibleVersions.code, code), eq(bibleVersions.isActive, true)))
    .limit(1);
  if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão da Bíblia não encontrada" });
  return version;
}

export async function loadPassage(versionCodeValue: string, reference: string) {
  const ref = parseReference(reference);
  if (!ref) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Referência inválida. Exemplo: Jo 3:16-18" });
  }
  const version = await findVersion(versionCodeValue);
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
    verses: cleanVerses(verses),
  };
}

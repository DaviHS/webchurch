import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

// Uso: node scripts/import-bible-headings.ts <codigo-da-versao> <pasta-com-os-arquivos-usfm>
// Lê os títulos de seção (\s, \s1) de arquivos USFM e grava em bible_headings, ligados à versão.
const [code, folder] = process.argv.slice(2);
if (!code || !folder) throw new Error("Uso: node scripts/import-bible-headings.ts <codigo-da-versao> <pasta-usfm>");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida (.env).");
const sql = neon(url);

const USFM_BOOKS = (
  "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL " +
  "MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split(" ");

const versions = await sql.query("select id from bible_versions where code = $1", [code]);
const versionId = (versions[0] as { id: number } | undefined)?.id;
if (!versionId) throw new Error(`Versão ${code} não existe em bible_versions.`);

interface Heading {
  bookId: number;
  chapter: number;
  verse: number;
  title: string;
}
const headings = new Map<string, Heading>();

for (const file of readdirSync(folder).filter((name) => name.toLowerCase().endsWith(".usfm"))) {
  const lines = readFileSync(join(folder, file), "utf8").split(/\r?\n/);
  let bookId = 0;
  let chapter = 0;
  let pending: string[] = [];
  for (const line of lines) {
    const id = /^\\id (\w{3})/.exec(line);
    if (id) {
      bookId = USFM_BOOKS.indexOf(id[1]!) + 1;
      chapter = 0;
      pending = [];
      continue;
    }
    if (bookId === 0) continue;
    const chapterMatch = /^\\c (\d+)/.exec(line);
    if (chapterMatch) {
      chapter = Number(chapterMatch[1]);
      continue;
    }
    const heading = /^\\s[1-9]? (.+)$/.exec(line);
    if (heading) {
      pending.push(heading[1]!.replace(/\\\w+\*?/g, "").replace(/\s+/g, " ").trim());
      continue;
    }
    const verse = /^\\v (\d+)/.exec(line);
    if (verse && pending.length > 0 && chapter > 0) {
      const title = pending.filter(Boolean).join(" — ").slice(0, 200);
      if (title) headings.set(`${bookId}:${chapter}:${verse[1]}`, { bookId, chapter, verse: Number(verse[1]), title });
      pending = [];
    }
  }
}

await sql.query("delete from bible_headings where version_id = $1", [versionId]);
const rows = [...headings.values()];
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const values = batch.map((_, n) => `($1, $${n * 4 + 2}, $${n * 4 + 3}, $${n * 4 + 4}, $${n * 4 + 5})`).join(", ");
  const params: (string | number)[] = [versionId];
  for (const row of batch) params.push(row.bookId, row.chapter, row.verse, row.title);
  await sql.query(`insert into bible_headings (version_id, book_id, chapter, verse, title) values ${values}`, params);
}
console.log(`${code}: ${rows.length} títulos gravados.`);

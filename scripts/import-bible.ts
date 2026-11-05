
import "dotenv/config";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const CHUNK = 3000;

const BOOKS: [string, string][] = [
  ["Gênesis", "Genesis"], ["Êxodo", "Exodus"], ["Levítico", "Leviticus"], ["Números", "Numbers"],
  ["Deuteronômio", "Deuteronomy"], ["Josué", "Joshua"], ["Juízes", "Judges"], ["Rute", "Ruth"],
  ["1 Samuel", "1 Samuel"], ["2 Samuel", "2 Samuel"], ["1 Reis", "1 Kings"], ["2 Reis", "2 Kings"],
  ["1 Crônicas", "1 Chronicles"], ["2 Crônicas", "2 Chronicles"], ["Esdras", "Ezra"],
  ["Neemias", "Nehemiah"], ["Ester", "Esther"], ["Jó", "Job"], ["Salmos", "Psalms"],
  ["Provérbios", "Proverbs"], ["Eclesiastes", "Ecclesiastes"], ["Cantares de Salomão", "Song of Solomon"],
  ["Isaías", "Isaiah"], ["Jeremias", "Jeremiah"], ["Lamentações", "Lamentations"],
  ["Ezequiel", "Ezekiel"], ["Daniel", "Daniel"], ["Oseias", "Hosea"], ["Joel", "Joel"],
  ["Amós", "Amos"], ["Obadias", "Obadiah"], ["Jonas", "Jonah"], ["Miqueias", "Micah"],
  ["Naum", "Nahum"], ["Habacuque", "Habakkuk"], ["Sofonias", "Zephaniah"], ["Ageu", "Haggai"],
  ["Zacarias", "Zechariah"], ["Malaquias", "Malachi"],
  ["Mateus", "Matthew"], ["Marcos", "Mark"], ["Lucas", "Luke"], ["João", "John"],
  ["Atos", "Acts"], ["Romanos", "Romans"], ["1 Coríntios", "1 Corinthians"],
  ["2 Coríntios", "2 Corinthians"], ["Gálatas", "Galatians"], ["Efésios", "Ephesians"],
  ["Filipenses", "Philippians"], ["Colossenses", "Colossians"], ["1 Tessalonicenses", "1 Thessalonians"],
  ["2 Tessalonicenses", "2 Thessalonians"], ["1 Timóteo", "1 Timothy"], ["2 Timóteo", "2 Timothy"],
  ["Tito", "Titus"], ["Filemom", "Philemon"], ["Hebreus", "Hebrews"], ["Tiago", "James"],
  ["1 Pedro", "1 Peter"], ["2 Pedro", "2 Peter"], ["1 João", "1 John"], ["2 João", "2 John"],
  ["3 João", "3 John"], ["Judas", "Jude"], ["Apocalipse", "Revelation"],
];

type Verse = { book: number; chapter: number; verse: number; text: string };
type Version = {
  code: string; name: string; language: string; publisher: string; license: string; verses: Verse[];
};

const dirArg = process.argv[2];
if (!dirArg) throw new Error("Informe a pasta com os arquivos.");
const dir: string = dirArg;
const dryRun = process.argv.includes("--dry-run");

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadAlmeida(file: string): { verses: Verse[]; abbrevs: string[]; chapters: number[] } {
  const data = readJson(join(dir, file));
  if (data.length !== 66) throw new Error(`${file}: esperava 66 livros, veio ${data.length}`);
  const verses: Verse[] = [];
  data.forEach((b: { chapters: string[][] }, i: number) =>
    b.chapters.forEach((chapter, c) =>
      chapter.forEach((text, v) =>
        verses.push({ book: i + 1, chapter: c + 1, verse: v + 1, text: text.trim() }),
      ),
    ),
  );
  return {
    verses,
    abbrevs: data.map((b: { abbrev: string }) => b.abbrev),
    chapters: data.map((b: { chapters: unknown[] }) => b.chapters.length),
  };
}

function loadKjv(): Verse[] {
  const verses: Verse[] = [];
  const files = readdirSync(join(dir, "kjv"));
  BOOKS.forEach(([, en], i) => {
    const file = files.find((f) => {
      const b = readJson(join(dir, "kjv", f));
      return b.book === en;
    });
    if (!file) throw new Error(`KJV: livro não encontrado: ${en}`);
    const b = readJson(join(dir, "kjv", file));
    for (const c of b.chapters)
      for (const v of c.verses)
        verses.push({ book: i + 1, chapter: Number(c.chapter), verse: Number(v.verse), text: String(v.text).trim() });
  });
  return verses;
}

function check(v: Version, expected?: number) {
  const keys = new Set(v.verses.map((x) => `${x.book}:${x.chapter}:${x.verse}`));
  if (keys.size !== v.verses.length) throw new Error(`${v.code}: versículos duplicados`);
  if (v.verses.some((x) => !x.text)) throw new Error(`${v.code}: versículo vazio`);
  if (expected && v.verses.length !== expected)
    throw new Error(`${v.code}: ${v.verses.length} versículos, esperava ${expected}`);
  console.log(`${v.code}: ${v.verses.length} versículos OK`);
}

const PUBLIC_DOMAIN = new Set(["TB", "BLIVRE", "ALM1911"]);

const CATALOG: { code: string; name: string; publisher: string }[] = [
  { code: "ARC", name: "Almeida Revista e Corrigida", publisher: "SBB" },
  { code: "ACF", name: "Almeida Corrigida e Fiel", publisher: "SBTB" },
  { code: "ARA", name: "Almeida Revista e Atualizada", publisher: "SBB" },
  { code: "NAA", name: "Nova Almeida Atualizada", publisher: "SBB" },
  { code: "NVI", name: "Nova Versão Internacional", publisher: "Biblica" },
  { code: "NVT", name: "Nova Versão Transformadora", publisher: "Mundo Cristão" },
  { code: "NTLH", name: "Nova Tradução na Linguagem de Hoje", publisher: "SBB" },
  { code: "NBV", name: "Nova Bíblia Viva", publisher: "Mundo Cristão" },
  { code: "AS21", name: "Almeida Século 21", publisher: "Vida Nova" },
  { code: "JFAA", name: "Almeida Atualizada", publisher: "" },
  { code: "KJA", name: "King James Atualizada", publisher: "Abba Press" },
  { code: "KJF", name: "King James Fiel", publisher: "BVBooks" },
  { code: "VFL", name: "Versão Fácil de Ler", publisher: "Bible League International" },
  { code: "OL", name: "O Livro", publisher: "Biblica" },
  { code: "MENS", name: "A Mensagem", publisher: "Editora Vida" },
  { code: "TB", name: "Tradução Brasileira", publisher: "Domínio público" },
  { code: "BLIVRE", name: "Bíblia Livre", publisher: "Domínio público" },
  { code: "ALM1911", name: "Almeida 1911", publisher: "Domínio público" },
];

const arc = loadAlmeida("ARC.json");

function foldStrayChapters(code: string, file: string): Verse[] {
  const { verses } = loadAlmeida(file);
  const stray = verses.filter((v) => v.chapter > arc.chapters[v.book - 1]!);
  if (stray.length === 0) return verses;
  const target = arc.chapters[stray[0]!.book - 1]! - 1;
  const kept = verses.filter((v) => v.chapter <= arc.chapters[v.book - 1]!);
  let next = Math.max(...kept.filter((v) => v.book === stray[0]!.book && v.chapter === target).map((v) => v.verse));
  for (const v of stray) kept.push({ book: v.book, chapter: target, verse: ++next, text: v.text });
  console.log(`${code}: ${stray.length} capítulos soltos de ${BOOKS[stray[0]!.book - 1]![0]} anexados ao capítulo ${target}`);
  return kept;
}

const versions: Version[] = CATALOG.map(({ code, name, publisher }) => ({
  code,
  name,
  language: "pt",
  publisher: publisher || "Não informada",
  license: PUBLIC_DOMAIN.has(code)
    ? "Domínio público. Texto obtido de damarals/biblias."
    : `Direitos reservados${publisher ? ` (${publisher})` : ""}. Texto obtido de damarals/biblias; confirme a licença antes de uso público.`,
  verses: foldStrayChapters(code, `${code}.json`),
}));

if (existsSync(join(dir, "kjv"))) {
  versions.push({
    code: "KJV", name: "King James Version", language: "en", publisher: "Domínio público",
    license: "Texto de 1769 da King James Version em inglês. Domínio público.",
    verses: loadKjv(),
  });
}

for (const v of versions) check(v);

if (dryRun) {
  console.log("--dry-run: nada foi gravado.");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida (.env).");
const sql = neon(url);
console.log("Banco:", new URL(url).host);

const ddl = readFileSync(join(import.meta.dirname, "migrations", "2026-11-04-biblia.sql"), "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const stmt of ddl) await sql.query(stmt);

await sql.transaction(
  BOOKS.map(([pt, en], i) =>
    sql.query(
      `INSERT INTO bible_books (id, testament, name_pt, abbrev_pt, name_en, chapters)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET testament=$2, name_pt=$3, abbrev_pt=$4, name_en=$5, chapters=$6`,
      [i + 1, i < 39 ? "AT" : "NT", pt, arc.abbrevs[i], en, arc.chapters[i]],
    ),
  ),
);

for (const v of versions) {
  const [row] = await sql.query(
    `INSERT INTO bible_versions (code, name, language, publisher, license_note)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (code) DO UPDATE SET name=$2, language=$3, publisher=$4, license_note=$5
     RETURNING id`,
    [v.code, v.name, v.language, v.publisher, v.license],
  );
  const versionId = row!.id as number;

  const queries = [sql.query("DELETE FROM bible_verses WHERE version_id = $1", [versionId])];
  for (let i = 0; i < v.verses.length; i += CHUNK) {
    const part = v.verses.slice(i, i + CHUNK);
    queries.push(
      sql.query(
        `INSERT INTO bible_verses (version_id, book_id, chapter, verse, text)
         SELECT $1, * FROM unnest($2::int[], $3::int[], $4::int[], $5::text[])`,
        [versionId, part.map((x) => x.book), part.map((x) => x.chapter), part.map((x) => x.verse), part.map((x) => x.text)],
      ),
    );
  }
  await sql.transaction(queries);

  const counted = (await sql.query("SELECT count(*)::int AS n FROM bible_verses WHERE version_id = $1", [versionId])) as { n: number }[];
  const n = counted[0]?.n ?? 0;
  console.log(`${v.code}: ${n} versículos no banco`);
  if (n !== v.verses.length) throw new Error(`${v.code}: contagem no banco diverge`);
}
console.log("Concluído.");

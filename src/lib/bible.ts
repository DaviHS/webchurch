
export interface BibleBookInfo {
  id: number;
  testament: "AT" | "NT";
  namePt: string;
  abbrev: string;
  nameEn: string;
  chapters: number;
}

const RAW_BOOKS: [string, string, string, number][] = [
  ["Gênesis", "Gn", "Genesis", 50], ["Êxodo", "Êx", "Exodus", 40], ["Levítico", "Lv", "Leviticus", 27],
  ["Números", "Nm", "Numbers", 36], ["Deuteronômio", "Dt", "Deuteronomy", 34], ["Josué", "Js", "Joshua", 24],
  ["Juízes", "Jz", "Judges", 21], ["Rute", "Rt", "Ruth", 4], ["1 Samuel", "1Sm", "1 Samuel", 31],
  ["2 Samuel", "2Sm", "2 Samuel", 24], ["1 Reis", "1Rs", "1 Kings", 22], ["2 Reis", "2Rs", "2 Kings", 25],
  ["1 Crônicas", "1Cr", "1 Chronicles", 29], ["2 Crônicas", "2Cr", "2 Chronicles", 36], ["Esdras", "Ed", "Ezra", 10],
  ["Neemias", "Ne", "Nehemiah", 13], ["Ester", "Et", "Esther", 10], ["Jó", "Jó", "Job", 42],
  ["Salmos", "Sl", "Psalms", 150], ["Provérbios", "Pv", "Proverbs", 31], ["Eclesiastes", "Ec", "Ecclesiastes", 12],
  ["Cantares de Salomão", "Ct", "Song of Solomon", 8], ["Isaías", "Is", "Isaiah", 66], ["Jeremias", "Jr", "Jeremiah", 52],
  ["Lamentações", "Lm", "Lamentations", 5], ["Ezequiel", "Ez", "Ezekiel", 48], ["Daniel", "Dn", "Daniel", 12],
  ["Oseias", "Os", "Hosea", 14], ["Joel", "Jl", "Joel", 3], ["Amós", "Am", "Amos", 9],
  ["Obadias", "Ob", "Obadiah", 1], ["Jonas", "Jn", "Jonah", 4], ["Miqueias", "Mq", "Micah", 7],
  ["Naum", "Na", "Nahum", 3], ["Habacuque", "Hc", "Habakkuk", 3], ["Sofonias", "Sf", "Zephaniah", 3],
  ["Ageu", "Ag", "Haggai", 2], ["Zacarias", "Zc", "Zechariah", 14], ["Malaquias", "Ml", "Malachi", 4],
  ["Mateus", "Mt", "Matthew", 28], ["Marcos", "Mc", "Mark", 16], ["Lucas", "Lc", "Luke", 24],
  ["João", "Jo", "John", 21], ["Atos", "At", "Acts", 28], ["Romanos", "Rm", "Romans", 16],
  ["1 Coríntios", "1Co", "1 Corinthians", 16], ["2 Coríntios", "2Co", "2 Corinthians", 13],
  ["Gálatas", "Gl", "Galatians", 6], ["Efésios", "Ef", "Ephesians", 6], ["Filipenses", "Fp", "Philippians", 4],
  ["Colossenses", "Cl", "Colossians", 4], ["1 Tessalonicenses", "1Ts", "1 Thessalonians", 5],
  ["2 Tessalonicenses", "2Ts", "2 Thessalonians", 3], ["1 Timóteo", "1Tm", "1 Timothy", 6],
  ["2 Timóteo", "2Tm", "2 Timothy", 4], ["Tito", "Tt", "Titus", 3], ["Filemom", "Fm", "Philemon", 1],
  ["Hebreus", "Hb", "Hebrews", 13], ["Tiago", "Tg", "James", 5], ["1 Pedro", "1Pe", "1 Peter", 5],
  ["2 Pedro", "2Pe", "2 Peter", 3], ["1 João", "1Jo", "1 John", 5], ["2 João", "2Jo", "2 John", 1],
  ["3 João", "3Jo", "3 John", 1], ["Judas", "Jd", "Jude", 1], ["Apocalipse", "Ap", "Revelation", 22],
];

export const BIBLE_BOOKS: BibleBookInfo[] = RAW_BOOKS.map(([namePt, abbrev, nameEn, chapters], index) => ({
  id: index + 1,
  testament: index < 39 ? "AT" : "NT",
  namePt,
  abbrev,
  nameEn,
  chapters,
}));

export function getBook(id: number): BibleBookInfo | undefined {
  return BIBLE_BOOKS[id - 1];
}

const EXTRA_ALIASES: Record<string, number> = {
  jo: 43,
  salmo: 19,
  proverbio: 20,
  canticos: 22,
  canticodoscanticos: 22,
  cantares: 22,
  atosdosapostolos: 44,
  revelacao: 66,
  revelacoes: 66,
  apoc: 66,
  ex: 2,
  gen: 1,
  mat: 40,
  mar: 41,
  luc: 42,
  joao: 43,
  rom: 45,
  heb: 58,
  tia: 59,
};

const lowerKey = (text: string) => text.toLowerCase().replace(/[\s.]+/g, "");
const plainKey = (text: string) =>
  lowerKey(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");

const accentedAliases = new Map<string, number>();
const plainAliases = new Map<string, number>();

for (const [alias, id] of Object.entries(EXTRA_ALIASES)) plainAliases.set(alias, id);
for (const book of BIBLE_BOOKS) {
  for (const text of [book.abbrev, book.namePt]) {
    const key = lowerKey(text);
    if (!accentedAliases.has(key)) accentedAliases.set(key, book.id);
  }
  for (const text of [book.abbrev, book.namePt, book.nameEn]) {
    const key = plainKey(text);
    if (!plainAliases.has(key)) plainAliases.set(key, book.id);
  }
}

export function findBook(input: string): BibleBookInfo | null {
  const accented = accentedAliases.get(lowerKey(input));
  if (accented) return getBook(accented) ?? null;

  const key = plainKey(input);
  if (key.length < 2) return null;
  const exact = plainAliases.get(key);
  if (exact) return getBook(exact) ?? null;

  const matches = BIBLE_BOOKS.filter(
    (book) => plainKey(book.namePt).startsWith(key) || plainKey(book.nameEn).startsWith(key),
  );
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

export interface BibleReference {
  book: BibleBookInfo;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
}

const REFERENCE_PATTERN =
  /^\s*((?:[1-3]\s*)?\p{L}[\p{L}.\s]*?)\s*(\d{1,3})(?:\s*[:.,]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?\s*$/u;

export function parseReference(input: string): BibleReference | null {
  const match = REFERENCE_PATTERN.exec(input);
  if (!match) return null;

  const book = findBook(match[1] ?? "");
  if (!book) return null;

  const chapter = Number(match[2]);
  if (chapter < 1 || chapter > book.chapters) return null;

  if (match[3] === undefined) return { book, chapter, verseStart: null, verseEnd: null };

  const start = Number(match[3]);
  if (start < 1) return null;
  const end = match[4] === undefined ? start : Number(match[4]);
  return { book, chapter, verseStart: Math.min(start, end), verseEnd: Math.max(start, end) };
}

export function formatChapterTitle(book: BibleBookInfo, chapter: number): string {
  return `${book.namePt} ${chapter}`;
}

export function formatReference(ref: BibleReference): string {
  const base = formatChapterTitle(ref.book, ref.chapter);
  if (ref.verseStart === null) return base;
  const end = ref.verseEnd ?? ref.verseStart;
  return end === ref.verseStart ? `${base}:${ref.verseStart}` : `${base}:${ref.verseStart}-${end}`;
}

export function neighborChapter(bookId: number, chapter: number, step: 1 | -1): { bookId: number; chapter: number } | null {
  const book = getBook(bookId);
  if (!book) return null;
  const target = chapter + step;
  if (target >= 1 && target <= book.chapters) return { bookId, chapter: target };
  const neighbor = getBook(bookId + step);
  if (!neighbor) return null;
  return { bookId: neighbor.id, chapter: step === 1 ? 1 : neighbor.chapters };
}

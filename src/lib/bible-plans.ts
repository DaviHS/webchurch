import { BIBLE_BOOKS, formatChapterTitle, getBook } from "@/lib/bible";

export interface ChapterRef {
  bookId: number;
  chapter: number;
}

export interface ReadingPlan {
  key: string;
  label: string;
  description: string;
  days: number;
  /** Capítulos na ordem de leitura. */
  chapters: ChapterRef[];
}

const chaptersOf = (bookIds: number[]): ChapterRef[] =>
  BIBLE_BOOKS.filter((book) => bookIds.includes(book.id)).flatMap((book) =>
    Array.from({ length: book.chapters }, (_, index) => ({ bookId: book.id, chapter: index + 1 })),
  );

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const makePlan = (key: string, label: string, description: string, days: number, bookIds: number[]): ReadingPlan => ({
  key,
  label,
  description,
  days,
  chapters: chaptersOf(bookIds),
});

const SALMOS = 19;
const PROVERBIOS = 20;

export const READING_PLANS: ReadingPlan[] = [
  makePlan("year", "Bíblia em 1 ano", "Do Gênesis ao Apocalipse em 365 dias, cerca de 3 capítulos por dia.", 365, range(1, 66)),
  makePlan("nt90", "Novo Testamento em 90 dias", "Do Evangelho de Mateus ao Apocalipse, cerca de 3 capítulos por dia.", 90, range(40, 66)),
  makePlan("psalms30", "Salmos e Provérbios em 30 dias", "Um pouco de Salmos e de Provérbios todos os dias.", 30, [SALMOS, PROVERBIOS]),
];

export const getPlan = (key: string): ReadingPlan | undefined => READING_PLANS.find((plan) => plan.key === key);

/** Capítulos de um dia (1 a plan.days): o plano é repartido de forma uniforme, em ordem. */
export function chaptersForDay(plan: ReadingPlan, day: number): ChapterRef[] {
  if (day < 1 || day > plan.days) return [];
  const total = plan.chapters.length;
  const from = Math.floor(((day - 1) * total) / plan.days);
  const to = Math.floor((day * total) / plan.days);
  return plan.chapters.slice(from, to);
}

/** "Gênesis 1–3" ou "Gênesis 50; Êxodo 1–2". */
export function describeChapters(chapters: ChapterRef[]): string {
  const groups: { bookId: number; from: number; to: number }[] = [];
  for (const { bookId, chapter } of chapters) {
    const last = groups[groups.length - 1];
    if (last?.bookId === bookId && chapter === last.to + 1) last.to = chapter;
    else groups.push({ bookId, from: chapter, to: chapter });
  }
  return groups
    .map(({ bookId, from, to }) => {
      const book = getBook(bookId);
      if (!book) return "";
      return from === to ? formatChapterTitle(book, from) : `${book.namePt} ${from}–${to}`;
    })
    .filter(Boolean)
    .join("; ");
}

const DAY_MS = 24 * 60 * 60 * 1000;

const dayNumber = (isoDate: string) => {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
};

/** Dia do plano em que a pessoa deveria estar hoje (1 a plan.days; 0 se a data inicial é futura). */
export function currentDay(plan: ReadingPlan, startedOn: string, today: string): number {
  const elapsed = dayNumber(today) - dayNumber(startedOn) + 1;
  return Math.max(0, Math.min(plan.days, elapsed));
}

/** Data local de hoje no formato AAAA-MM-DD. */
export function localToday(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

import { BIBLE_BOOKS, formatChapterTitle, getBook } from "@/lib/bible";
import { VERSE_COUNTS } from "@/lib/bible-verse-counts";

export interface ChapterRef {
  bookId: number;
  chapter: number;
}

export interface ReadingPlan {
  key: string;
  label: string;
  description: string;
  days: number;
  chapters: ChapterRef[];
  dayStarts: number[];
}

const chaptersOf = (bookIds: number[]): ChapterRef[] =>
  BIBLE_BOOKS.filter((book) => bookIds.includes(book.id)).flatMap((book) =>
    Array.from({ length: book.chapters }, (_, index) => ({ bookId: book.id, chapter: index + 1 })),
  );

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const versesOf = ({ bookId, chapter }: ChapterRef) => VERSE_COUNTS[bookId]?.[chapter - 1] ?? 1;

function splitByVerses(chapters: ChapterRef[], days: number): number[] {
  const total = chapters.reduce((sum, chapter) => sum + versesOf(chapter), 0);
  const starts: number[] = [0];
  let index = 0;
  let accumulated = 0;
  for (let day = 1; day < days; day += 1) {
    const goal = (total * day) / days;
    const mustLeave = days - day;
    do {
      accumulated += versesOf(chapters[index]!);
      index += 1;
    } while (
      chapters.length - index > mustLeave &&
      Math.abs(accumulated + versesOf(chapters[index]!) - goal) < Math.abs(accumulated - goal)
    );
    starts.push(index);
  }
  return starts;
}

const makePlan = (key: string, label: string, description: string, days: number, bookIds: number[]): ReadingPlan => {
  const chapters = chaptersOf(bookIds);
  return { key, label, description, days, chapters, dayStarts: splitByVerses(chapters, days) };
};

const SALMOS = 19;
const PROVERBIOS = 20;

export const READING_PLANS: ReadingPlan[] = [
  makePlan("year", "Bíblia em 1 ano", "Do Gênesis ao Apocalipse em 365 dias, cerca de 3 capítulos por dia.", 365, range(1, 66)),
  makePlan("nt90", "Novo Testamento em 90 dias", "Do Evangelho de Mateus ao Apocalipse, cerca de 3 capítulos por dia.", 90, range(40, 66)),
  makePlan("psalms30", "Salmos e Provérbios em 30 dias", "Um pouco de Salmos e de Provérbios todos os dias.", 30, [SALMOS, PROVERBIOS]),
  makePlan("gospels30", "Evangelhos em 30 dias", "Mateus, Marcos, Lucas e João: a vida de Jesus em um mês.", 30, range(40, 43)),
  makePlan("proverbs31", "Provérbios em 31 dias", "Um capítulo de Provérbios por dia, um por dia do mês.", 31, [PROVERBIOS]),
  makePlan("paul30", "Cartas de Paulo em 30 dias", "De Romanos a Filemom, em um mês.", 30, range(45, 57)),
];

export const getPlan = (key: string): ReadingPlan | undefined => READING_PLANS.find((plan) => plan.key === key);

export function chaptersForDay(plan: ReadingPlan, day: number): ChapterRef[] {
  if (day < 1 || day > plan.days) return [];
  const from = plan.dayStarts[day - 1] ?? 0;
  const to = plan.dayStarts[day] ?? plan.chapters.length;
  return plan.chapters.slice(from, to);
}

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

export function currentDay(plan: ReadingPlan, startedOn: string, today: string): number {
  const elapsed = dayNumber(today) - dayNumber(startedOn) + 1;
  return Math.max(0, Math.min(plan.days, elapsed));
}

export function localToday(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

import { TRPCClientError } from "@trpc/client";
import { BIBLE_BOOKS } from "@/lib/bible";

const MAX_CONSECUTIVE_FAILURES = 8;
const WORKERS = 4;
const DOWNLOAD_PREFIX = "bible-offline:";
const PROMPT_KEY = "bible-offline-prompt-until";
const BIBLE_CACHE = "bible-text";
export const MAIN_VERSIONS = ["ARA", "NVI", "ACF", "NAA"];
const PROMPT_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

const ALL_CHAPTERS = BIBLE_BOOKS.flatMap((book) =>
  Array.from({ length: book.chapters }, (_, index) => ({ bookId: book.id, chapter: index + 1 })),
);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export const readDownloadedAt = (version: string) => read(DOWNLOAD_PREFIX + version);
export const markDownloaded = (version: string, value: string) => write(DOWNLOAD_PREFIX + version, value);

export function forgetDownloaded(version: string) {
  try {
    localStorage.removeItem(DOWNLOAD_PREFIX + version);
  } catch {}
}

export async function removeDownloaded(version: string): Promise<void> {
  forgetDownloaded(version);
  if (typeof caches === "undefined") return;
  const cache = await caches.open(BIBLE_CACHE);
  const marker = `"version":"${version}"`;
  const entries = await cache.keys();
  await Promise.all(
    entries.filter((request) => decodeURIComponent(request.url).includes(marker)).map((request) => cache.delete(request)),
  );
}

export function shouldAskToDownload(version: string): boolean {
  if (readDownloadedAt(version)) return false;
  const until = Number(read(PROMPT_KEY));
  return !(Number.isFinite(until) && until > Date.now());
}

export const snoozeDownloadPrompt = () => write(PROMPT_KEY, String(Date.now() + PROMPT_SNOOZE_MS));

export function connectionIsLimited(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string; type?: string } }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || connection.type === "cellular" || ["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
}

const isNotFound = (error: unknown) =>
  error instanceof TRPCClientError && (error.data as { code?: string } | undefined)?.code === "NOT_FOUND";

export interface DownloadResult {
  failures: number;
  offline: boolean;
  cancelled: boolean;
}

interface ChapterClient {
  query: (input: { version: string; bookId: number; chapter: number }) => Promise<unknown>;
}

export async function downloadBibleVersion(
  client: ChapterClient,
  version: string,
  control: { cancelled: boolean },
  onProgress: (done: number, total: number) => void,
): Promise<DownloadResult> {
  void navigator.storage?.persist?.().catch(() => false);

  let next = 0;
  let done = 0;
  let failures = 0;
  let consecutive = 0;

  const worker = async () => {
    while (!control.cancelled) {
      const item = ALL_CHAPTERS[next++];
      if (!item) return;
      try {
        await client.query({ version, ...item });
        consecutive = 0;
      } catch (error) {
        if (isNotFound(error)) {
          consecutive = 0;
        } else {
          failures += 1;
          consecutive += 1;
          if (consecutive >= MAX_CONSECUTIVE_FAILURES) control.cancelled = true;
        }
      }
      done += 1;
      onProgress(done, ALL_CHAPTERS.length);
    }
  };

  await Promise.all(Array.from({ length: WORKERS }, worker));
  const offline = consecutive >= MAX_CONSECUTIVE_FAILURES;
  return { failures, offline, cancelled: control.cancelled && !offline };
}

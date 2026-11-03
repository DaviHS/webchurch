import { z } from "zod";
import type { DeckSongSource } from "./deck";

const STORAGE_PREFIX = "presentation-deck:";

const deckSourceSchema = z.object({
  key: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  songs: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      artist: z.string().nullable(),
      lyrics: z.string().nullable(),
    })
  ),
  savedAt: z.number(),
});

export type CachedDeckSource = z.infer<typeof deckSourceSchema>;

export interface DeckSource {
  key: string;
  title: string;
  subtitle: string | null;
  songs: DeckSongSource[];
}

export function loadCachedDeck(key: string): CachedDeckSource | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = deckSourceSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveCachedDeck(source: DeckSource): void {
  const payload: CachedDeckSource = {
    key: source.key,
    title: source.title,
    subtitle: source.subtitle,
    songs: source.songs.map(({ id, title, artist, lyrics }) => ({ id, title, artist, lyrics })),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_PREFIX + source.key, JSON.stringify(payload));
  } catch (error) {
    console.warn("Não foi possível salvar o repertório para uso offline:", error);
  }
}

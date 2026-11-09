import { cleanPastedLyrics, stripAccents } from "@/lib/lyrics";

/** Uma letra encontrada na busca automática. */
export interface LyricsCandidate {
  title: string;
  artist: string;
  album: string | null;
  lyrics: string;
}

interface LrclibItem {
  trackName?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  plainLyrics?: string | null;
  instrumental?: boolean;
}

const ENDPOINT = "https://lrclib.net/api/search";

const norm = (value: string) => stripAccents(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function query(params: Record<string, string>): Promise<LrclibItem[]> {
  const response = await fetch(`${ENDPOINT}?${new URLSearchParams(params).toString()}`, {
    headers: { "User-Agent": "webchurch (igreja)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as LrclibItem[]) : [];
}

/**
 * Procura a letra no LRCLIB (base aberta e gratuita, sem chave).
 * Tenta título + artista; se não achar, busca só pelo título e ordena pelo artista mais parecido.
 */
export async function findLyrics(title: string, artist: string): Promise<LyricsCandidate[]> {
  const cleanTitle = title.trim();
  const cleanArtist = artist.trim();
  if (!cleanTitle) return [];

  let items: LrclibItem[] = [];
  try {
    if (cleanArtist) items = await query({ track_name: cleanTitle, artist_name: cleanArtist });
    if (items.length === 0) items = await query({ q: `${cleanTitle} ${cleanArtist}`.trim() });
    if (items.length === 0 && cleanArtist) items = await query({ track_name: cleanTitle });
  } catch {
    return [];
  }

  const wantedTitle = norm(cleanTitle);
  const wantedArtist = norm(cleanArtist);
  const seen = new Set<string>();
  const scored: { score: number; candidate: LyricsCandidate }[] = [];

  for (const item of items) {
    const lyrics = cleanPastedLyrics(item.plainLyrics ?? "");
    if (item.instrumental || !lyrics) continue;
    const itemTitle = item.trackName ?? "";
    const itemArtist = item.artistName ?? "";
    const key = norm(`${itemTitle} ${itemArtist}`) + lyrics.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);

    const t = norm(itemTitle);
    const a = norm(itemArtist);
    let score = 0;
    if (t === wantedTitle) score += 4;
    else if (t.includes(wantedTitle) || wantedTitle.includes(t)) score += 2;
    if (wantedArtist && (a === wantedArtist || a.includes(wantedArtist) || wantedArtist.includes(a))) score += 3;
    scored.push({ score, candidate: { title: itemTitle, artist: itemArtist, album: item.albumName ?? null, lyrics } });
  }

  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, 5)
    .map((row) => row.candidate);
}

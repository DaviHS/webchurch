export const stripAccents = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "");

const normalize = (value: string) => stripAccents(value).toLowerCase();

export function lyricsSnippet(lyrics: string | null | undefined, query: string, radius = 36): string | null {
  const term = normalize(query.trim());
  if (!lyrics || term.length < 2) return null;
  const flat = lyrics.replace(/\s+/g, " ");
  const index = normalize(flat).indexOf(term);
  if (index < 0) return null;
  const start = Math.max(0, index - radius);
  const end = Math.min(flat.length, index + term.length + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end).trim()}${end < flat.length ? "…" : ""}`;
}

export function matchesTitleOrArtist(title: string, artist: string | null | undefined, query: string): boolean {
  const term = normalize(query.trim());
  return term.length > 0 && normalize(`${title} ${artist ?? ""}`).includes(term);
}

export function cleanPastedLyrics(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function lettersSearchUrl(title: string, artist?: string | null): string {
  const query = [artist, title].filter(Boolean).join(" ").trim();
  return `https://www.letras.mus.br/?q=${encodeURIComponent(query)}`;
}

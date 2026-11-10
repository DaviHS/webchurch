import type { PlaylistTrack } from "@/lib/spotify";
import { baseTitle, normalizeText } from "@/lib/text";

export interface CatalogSong {
  id: number;
  title: string;
  artist: string | null;
  trackId: string | null;
}

export type TrackMatch = PlaylistTrack & {
  status: "match" | "version" | "new";
  songId: number | null;
  songTitle: string | null;
};

/**
 * Liga cada faixa da playlist a uma música cadastrada:
 * "match" (mesma faixa), "version" (mesmo título, outra gravação) ou "new" (não cadastrada).
 * Faixas repetidas aparecem uma vez só.
 */
export function matchTracksToCatalog(tracks: PlaylistTrack[], catalog: CatalogSong[]): TrackMatch[] {
  const byTrackId = new Map(catalog.flatMap((song) => (song.trackId ? [[song.trackId, song] as const] : [])));
  const seen = new Set<string>();
  const matches: TrackMatch[] = [];

  for (const track of tracks) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);

    const exact = byTrackId.get(track.id);
    if (exact) {
      matches.push({ ...track, status: "match", songId: exact.id, songTitle: exact.title });
      continue;
    }

    const version = findSameTitle(track, catalog);
    if (version) matches.push({ ...track, status: "version", songId: version.id, songTitle: version.title });
    else matches.push({ ...track, status: "new", songId: null, songTitle: null });
  }
  return matches;
}

function findSameTitle(track: PlaylistTrack, catalog: CatalogSong[]): CatalogSong | undefined {
  const title = baseTitle(track.name);
  if (!title) return undefined;

  const sameTitle = catalog.filter((song) => baseTitle(song.title) === title);
  const artist = normalizeText(track.artist);
  return sameTitle.find((song) => song.artist && artist.includes(normalizeText(song.artist))) ?? sameTitle[0];
}

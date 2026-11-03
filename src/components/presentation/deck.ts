export interface DeckSongSource {
  id: number;
  title: string;
  artist: string | null;
  lyrics: string | null;
}

export interface DeckSong {
  uid: string;
  id: number;
  title: string;
  artist: string | null;
  slides: string[];
  adHoc: boolean;
}

export interface Deck {
  key: string;
  title: string;
  subtitle: string | null;
  songs: DeckSong[];
}

export interface Position {
  song: number;
  slide: number;
}

const MAX_LINES_PER_SLIDE = 6;

function balanceStanza(lines: string[]): string[] {
  if (lines.length <= MAX_LINES_PER_SLIDE) return [lines.join("\n")];
  const parts = Math.ceil(lines.length / MAX_LINES_PER_SLIDE);
  const size = Math.ceil(lines.length / parts);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size).join("\n"));
  }
  return chunks;
}

export function lyricsToSlides(lyrics: string | null): string[] {
  if (!lyrics) return [];
  return lyrics
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((stanza) =>
      stanza
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
    )
    .filter((lines) => lines.length > 0)
    .flatMap(balanceStanza);
}

export function toDeckSong(source: DeckSongSource, uid: string, adHoc = false): DeckSong {
  return {
    uid,
    id: source.id,
    title: source.title,
    artist: source.artist === "" ? null : source.artist,
    slides: lyricsToSlides(source.lyrics),
    adHoc,
  };
}

export function buildDeck(source: {
  key: string;
  title: string;
  subtitle: string | null;
  songs: DeckSongSource[];
}): Deck {
  return {
    key: source.key,
    title: source.title,
    subtitle: source.subtitle,
    songs: source.songs.map((song, index) => toDeckSong(song, `${source.key}:${index}:${song.id}`)),
  };
}

export function slideAt(deck: Deck, position: Position | null): string | null {
  if (!position) return null;
  return deck.songs[position.song]?.slides[position.slide] ?? null;
}

export function isValidPosition(deck: Deck, position: Position | null): position is Position {
  return slideAt(deck, position) !== null;
}

function firstSlideFrom(deck: Deck, fromSong: number): Position | null {
  for (let song = fromSong; song < deck.songs.length; song++) {
    if ((deck.songs[song]?.slides.length ?? 0) > 0) return { song, slide: 0 };
  }
  return null;
}

function lastSlideUntil(deck: Deck, fromSong: number): Position | null {
  for (let song = fromSong; song >= 0; song--) {
    const count = deck.songs[song]?.slides.length ?? 0;
    if (count > 0) return { song, slide: count - 1 };
  }
  return null;
}

export function nextPosition(deck: Deck, position: Position | null): Position | null {
  if (!isValidPosition(deck, position)) return firstSlideFrom(deck, 0);
  const count = deck.songs[position.song]?.slides.length ?? 0;
  if (position.slide + 1 < count) return { song: position.song, slide: position.slide + 1 };
  return firstSlideFrom(deck, position.song + 1);
}

export function previousPosition(deck: Deck, position: Position | null): Position | null {
  if (!isValidPosition(deck, position)) return null;
  if (position.slide > 0) return { song: position.song, slide: position.slide - 1 };
  return lastSlideUntil(deck, position.song - 1);
}

export function samePosition(a: Position | null, b: Position | null): boolean {
  return a?.song === b?.song && a?.slide === b?.slide;
}

export function slideLabel(deck: Deck, position: Position): string {
  const count = deck.songs[position.song]?.slides.length ?? 0;
  return `Estrofe ${position.slide + 1}/${count}`;
}

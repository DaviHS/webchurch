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
  kind: "song" | "bible";
  slideLabels: string[] | null;
  source: PassageSource | null;
  versesPerSlide: number | null;
  slideFirstVerse: number[] | null;
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
    kind: "song",
    slideLabels: null,
    source: null,
    versesPerSlide: null,
    slideFirstVerse: null,
  };
}

export interface PassageSource {
  title: string;
  bookChapter: string;
  version: { code: string; name: string };
  verses: { verse: number; text: string }[];
}

const MAX_CHARS_PER_BIBLE_SLIDE = 260;
const MAX_VERSES_PER_BIBLE_SLIDE = 3;
const BIBLE_LINE_WIDTH = 40;
const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

const superscript = (value: number) =>
  String(value)
    .split("")
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join("");

function wrapText(text: string, width: number): string {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/[ \t\r\n]+/).filter(Boolean)) {
    if (current !== "" && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current === "" ? word : `${current} ${word}`;
    }
  }
  if (current !== "") lines.push(current);
  return lines.join("\n");
}

export const VERSES_PER_SLIDE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export function passageToDeckSong(passage: PassageSource, uid: string, versesPerSlide: number | null = null): DeckSong {
  const showNumbers = passage.verses.length > 1;
  const groups: PassageSource["verses"][] = [];
  let chars = 0;
  for (const verse of passage.verses) {
    const last = groups[groups.length - 1];
    const fits =
      last !== undefined &&
      (versesPerSlide !== null
        ? last.length < versesPerSlide
        : last.length < MAX_VERSES_PER_BIBLE_SLIDE && chars + verse.text.length <= MAX_CHARS_PER_BIBLE_SLIDE);
    if (last && fits) {
      last.push(verse);
      chars += verse.text.length;
    } else {
      groups.push([verse]);
      chars = verse.text.length;
    }
  }

  return {
    uid,
    id: 0,
    title: `${passage.title} · ${passage.version.code}`,
    artist: passage.version.name,
    slides: groups.map((group) =>
      wrapText(
        group.map((v) => (showNumbers ? `${superscript(v.verse)} ${v.text}` : v.text)).join(" "),
        BIBLE_LINE_WIDTH,
      ),
    ),
    adHoc: true,
    kind: "bible",
    source: passage,
    versesPerSlide,
    slideFirstVerse: groups.map((group) => group[0]?.verse ?? 0),
    slideLabels: groups.map((group) => {
      const first = group[0]?.verse ?? 0;
      const last = group[group.length - 1]?.verse ?? first;
      return `${passage.bookChapter}:${first === last ? first : `${first}-${last}`}`;
    }),
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
  const song = deck.songs[position.song];
  const custom = song?.slideLabels?.[position.slide];
  if (custom) return custom;
  return `Estrofe ${position.slide + 1}/${song?.slides.length ?? 0}`;
}

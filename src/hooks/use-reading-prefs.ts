"use client";

import { useSyncExternalStore } from "react";

export const READING_FONTS = [
  { value: "sans", label: "Padrão", family: "inherit" },
  { value: "serif", label: "Serifada", family: 'Georgia, Cambria, "Times New Roman", serif' },
  { value: "book", label: "Livro", family: 'var(--font-book), Georgia, serif' },
] as const;

export type ReadingFont = (typeof READING_FONTS)[number]["value"];

export const READING_SIZES = [14, 16, 18, 20, 24, 28, 32] as const;

export type ReadingLayout = "flow" | "lines";

export interface ReadingPrefs {
  font: ReadingFont;
  size: number;
  layout: ReadingLayout;
  pickVerse: boolean;
}

const STORAGE_KEY = "bible-reading";
export const DEFAULT_READING_PREFS: ReadingPrefs = { font: "sans", size: 1, layout: "flow", pickVerse: false };

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cached: ReadingPrefs = DEFAULT_READING_PREFS;
let memoryRaw: string | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
}

function parse(raw: string | null): ReadingPrefs {
  if (!raw) return DEFAULT_READING_PREFS;
  try {
    const value = JSON.parse(raw) as Partial<ReadingPrefs>;
    return {
      font: READING_FONTS.find((font) => font.value === value.font)?.value ?? DEFAULT_READING_PREFS.font,
      size:
        typeof value.size === "number" && Number.isInteger(value.size) && value.size >= 0 && value.size < READING_SIZES.length
          ? value.size
          : DEFAULT_READING_PREFS.size,
      layout: value.layout === "lines" ? "lines" : "flow",
      pickVerse: value.pickVerse === true,
    };
  } catch {
    return DEFAULT_READING_PREFS;
  }
}

function getSnapshot(): ReadingPrefs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function update(patch: Partial<ReadingPrefs>) {
  const next = { ...getSnapshot(), ...patch };
  const raw = JSON.stringify(next);
  memoryRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function useReadingPrefs(): [ReadingPrefs, (patch: Partial<ReadingPrefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_READING_PREFS);
  return [prefs, update];
}

export const fontFamilyOf = (font: ReadingFont) => READING_FONTS.find((option) => option.value === font)?.family ?? "inherit";

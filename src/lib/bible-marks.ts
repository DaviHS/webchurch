export const BIBLE_MARK_COLORS = [
  { value: "yellow", label: "Amarelo", highlight: "bg-yellow-200/70 dark:bg-yellow-500/30", swatch: "bg-yellow-300" },
  { value: "green", label: "Verde", highlight: "bg-green-200/70 dark:bg-green-500/30", swatch: "bg-green-400" },
  { value: "blue", label: "Azul", highlight: "bg-sky-200/70 dark:bg-sky-500/30", swatch: "bg-sky-400" },
  { value: "pink", label: "Rosa", highlight: "bg-pink-200/70 dark:bg-pink-500/30", swatch: "bg-pink-400" },
] as const;

export type BibleMarkColor = (typeof BIBLE_MARK_COLORS)[number]["value"];

export const BIBLE_MARK_COLOR_VALUES = BIBLE_MARK_COLORS.map((color) => color.value) as [BibleMarkColor, ...BibleMarkColor[]];

export const markColor = (value: string | null | undefined) => BIBLE_MARK_COLORS.find((color) => color.value === value);

export const MAX_NOTE_LENGTH = 2000;

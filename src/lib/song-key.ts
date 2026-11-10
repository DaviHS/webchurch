import { normalizeText } from "@/lib/text";

export const songKey = (title: string, artist: string | null | undefined) => `${normalizeText(title)}|${normalizeText(artist)}`;

import { z } from "zod"

const durationToSeconds = (duration: string): number => {
  const [minutes = 0, seconds = 0] = duration
    .split(":")
    .map((part) => Number.parseInt(part, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));
  return minutes * 60 + seconds;
};

export const songCategories = ["hymn", "praise", "worship", "chorus", "special"] as const;
export type SongCategory = (typeof songCategories)[number];

export const songFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().optional().default(""),
  category: z.enum(["hymn", "praise", "worship", "chorus", "special"]),
  lyrics: z.string().optional().default(""),
  youtubeUrl: z.string().url("URL inválida").optional().or(z.literal("")).default(""),
  spotifyUrl: z.string().optional(),
  skipPlaylist: z.boolean().optional().default(false),
  duration: z.string()
    .regex(/^(\d{1,2}:\d{2})?$/, "Formato inválido. Use mm:ss (ex: 03:30)")
    .optional()
    .default(""),
})

export const songSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().optional().default(""),
  category: z.enum(["hymn", "praise", "worship", "chorus", "special"]),
  lyrics: z.string().optional().default(""),
  youtubeUrl: z.string().url("URL inválida").optional().or(z.literal("")).default(""),
  spotifyUrl: z.string().url().optional().or(z.literal("")).default(""),
  skipPlaylist: z.boolean().optional().default(false),
  duration: z.union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        return durationToSeconds(val);
      }
      return val;
    })
    .optional()
    .default(0),
  key: z.string().optional(),
})

export type SongFormData = z.infer<typeof songSchema>
export type SongFormInput = z.input<typeof songFormSchema>
export type SongFormOutput = z.output<typeof songFormSchema>
export function isSongCategory(value: string | null | undefined): value is SongCategory {
  return songCategories.some((category) => category === value);
}

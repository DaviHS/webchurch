// validators/song.ts
import { z } from "zod"

// Função para converter minutos:segundos em segundos
const durationToSeconds = (duration: string): number => {
  if (!duration) return 0;
  const [minutes, seconds] = duration.split(':').map(Number);
  return (minutes! * 60) + (seconds || 0);
};

// Schema para entrada (formulário)
export const songFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().optional().default(""),
  category: z.enum(["hymn", "praise", "worship", "chorus", "special"]),
  lyrics: z.string().optional().default(""),
  youtubeUrl: z.string().url("URL inválida").optional().or(z.literal("")).default(""),
  spotifyUrl: z.string().optional(),
  duration: z.string()
    .regex(/^\d{1,2}:\d{2}$/, "Formato inválido. Use mm:ss (ex: 03:30)")
    .optional()
    .default(""),
})

// Schema para a API (aceita número ou string)
export const songSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().optional().default(""),
  category: z.enum(["hymn", "praise", "worship", "chorus", "special"]),
  lyrics: z.string().optional().default(""),
  youtubeUrl: z.string().url("URL inválida").optional().or(z.literal("")).default(""),
  spotifyUrl: z.string().url().optional().or(z.literal("")).default(""),
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
export type SongFormInput = z.infer<typeof songFormSchema>
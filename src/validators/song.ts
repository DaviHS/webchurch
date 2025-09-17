import { z } from "zod"

export const songSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().optional(),
  category: z.enum(["hymn", "praise", "worship", "chorus", "special"]),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  youtubeUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  duration: z.number().int().positive("Duração deve ser positiva").optional(),
  bpm: z.number().int().positive("BPM deve ser positivo").optional(),
  key: z.string().optional(),
})

export type SongFormData = z.infer<typeof songSchema>
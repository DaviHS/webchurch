import { z } from "zod"

export const eventTypes = ["cult", "celebration", "meeting", "conference", "rehearsal", "other", "template"] as const;
export type EventType = (typeof eventTypes)[number];

export const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(eventTypes),
  date: z.union([z.date(), z.string().min(1, "Data é obrigatória")]).pipe(z.coerce.date()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  preacher: z.string().optional(),
  bibleVerse: z.string().optional(),
})

export const eventUpdateSchema = eventSchema.partial();

export const eventSongSchema = z.object({
  songId: z.number(),
  order: z.number(),
  leaderId: z.number().optional(),
  notes: z.string().optional(),
})

export const eventParticipantSchema = z.object({
  memberId: z.number(),
  role: z.string().min(1, "Função é obrigatória"),
  instrument: z.string().optional(),
})


export type EventFormData = z.infer<typeof eventSchema>
export type EventSongFormData = z.infer<typeof eventSongSchema>
export type EventParticipantFormData = z.infer<typeof eventParticipantSchema>
export type EventFormInput = z.input<typeof eventSchema>

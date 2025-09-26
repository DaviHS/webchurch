// validators/ministry.ts
import { z } from "zod"

export const ministrySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().optional(),
})

export const functionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
})

export const ministryFunctionSchema = z.object({
  ministryId: z.number(),
  functionId: z.number(),
})

export type MinistryFormData = z.infer<typeof ministrySchema>
export type FunctionFormData = z.infer<typeof functionSchema>
export type MinistryFunctionData = z.infer<typeof ministryFunctionSchema>
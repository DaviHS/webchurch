import { z } from "zod"

export const memberSchema = z.object({
  // Dados pessoais básicos
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(50),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  

  // Dados pessoais complementares
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional().default("single"),

  // Endereço
  address: z.string().optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),

  // Dados da igreja
  baptized: z.boolean().optional(),
  churchRole: z.string().optional(),
  baptismDate: z.string().optional().nullable(),
  memberSince: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "visiting", "transferred"]).default("active"),

  // Informações adicionais
  profession: z.string().max(100).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),

  // Observações
  notes: z.string().optional(),

  // Ministérios
  ministries: z
    .array(
      z.object({
        ministryId: z.number(),
        functionId: z.number().optional()
      }),
    )
    .optional(),
})

export type MemberFormData = z.infer<typeof memberSchema>

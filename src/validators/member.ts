// validators/member.ts
import { z } from "zod"

export const memberSchema = z.object({
  // Dados pessoais básicos
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(50),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  
  // Dados pessoais complementares
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().nullable(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional().default("single"),

  // Endereço
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  zipCode: z.string().max(10).optional().or(z.literal("")),

  // Dados da igreja
  baptized: z.boolean().optional().default(false),
  baptismDate: z.string().optional().or(z.literal("")),
  memberSince: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "visiting", "transferred"]).default("active"),

  // Informações adicionais
  profession: z.string().max(100).optional().or(z.literal("")),
  emergencyContact: z.string().max(100).optional().or(z.literal("")),
  emergencyPhone: z.string().max(20).optional().or(z.literal("")),

  // Observações
  notes: z.string().optional().or(z.literal("")),

  // Ministérios
  ministries: z
    .array(
      z.object({
        ministryId: z.number(),
        functionId: z.number().optional().nullable()
      }),
    )
    .optional(),
})

export type MemberFormData = z.infer<typeof memberSchema>
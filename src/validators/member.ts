import { z } from "zod"

export const memberSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Máximo de 50 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(50, "Máximo de 50 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().nullable(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional().default("single"),

  address: z.string().optional().or(z.literal("")),
  city: z.string().max(50, "Máximo de 50 caracteres").optional().or(z.literal("")),
  state: z.string().max(2, "Máximo de 2 caracteres").optional().or(z.literal("")),
  zipCode: z.string().max(10, "Máximo de 10 caracteres").optional().or(z.literal("")),

  baptized: z.boolean().optional().default(false),
  baptismDate: z.string().optional().or(z.literal("")),
  memberSince: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "visiting", "transferred"]).default("active"),

  profession: z.string().max(100, "Máximo de 100 caracteres").optional().or(z.literal("")),
  emergencyContact: z.string().max(100, "Máximo de 100 caracteres").optional().or(z.literal("")),
  emergencyPhone: z.string().max(20, "Máximo de 20 caracteres").optional().or(z.literal("")),

  notes: z.string().optional().or(z.literal("")),

  ministries: z.array(z.object({
    ministryId: z.number(),
    functionId: z.number().optional().nullable(),
  })).default([]),
}).transform((data) =>
  data.baptized ? data : { ...data, baptismDate: "" }
)

export type MemberFormData = z.infer<typeof memberSchema>
export type MemberFormInput = z.input<typeof memberSchema>

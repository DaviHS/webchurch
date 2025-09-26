import z from "zod"

export const userCreateSchema = z.object({
  memberId: z.number(),
  email: z.string().email(),
  password: z.string().min(6),
})

export const userUpdateSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type UserCreateData = z.infer<typeof userCreateSchema>
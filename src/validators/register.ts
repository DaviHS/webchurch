import { z } from "zod";

export const registerSchema = z.object({
  // Dados pessoais básicos
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(50),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().default("male"),
  
  // Endereço
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  zipCode: z.string().max(10).optional().or(z.literal("")),
  
  // Dados da igreja
  baptized: z.boolean().optional().default(false),
  baptismDate: z.string().optional().or(z.literal("")),
  memberSince: z.string().optional().or(z.literal("")),
  
  // Senha
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;
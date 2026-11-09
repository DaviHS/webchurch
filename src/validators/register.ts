import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Máximo de 50 caracteres"),
  lastName: z.string().trim().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(50, "Máximo de 50 caracteres"),
  // Sempre em minúsculas e sem espaços: é assim que o login e a recuperação de senha procuram a conta.
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(100, "Máximo de 100 caracteres"),
  // A liderança confirma quem é a pessoa pelo telefone antes de aprovar o acesso.
  phone: z.string().refine(isValidPhone, "Informe o telefone com DDD, por exemplo (11) 99999-9999"),
  phoneIsWhatsapp: z.boolean().optional().default(false),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female"], { message: "Selecione o gênero" }),

  address: z.string().optional().or(z.literal("")),
  city: z.string().max(50, "Máximo de 50 caracteres").optional().or(z.literal("")),
  state: z.string().max(2, "Máximo de 2 caracteres").optional().or(z.literal("")),
  zipCode: z.string().max(10, "Máximo de 10 caracteres").optional().or(z.literal("")),

  baptized: z.boolean().optional().default(false),
  baptismDate: z.string().optional().or(z.literal("")),
  memberSince: z.string().optional().or(z.literal("")),

  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).transform((data) =>
  data.baptized ? data : { ...data, baptismDate: "" }
);

export type RegisterData = z.infer<typeof registerSchema>;
export type RegisterInput = z.input<typeof registerSchema>;

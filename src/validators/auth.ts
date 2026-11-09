import { z } from "zod";

export const signInSchema = z.object({
  // Minúsculas e sem espaços: o cadastro grava assim, então "Ana@Gmail.com" e "ana@gmail.com" são a mesma conta.
  email: z.string().trim().toLowerCase(),
  password: z.string().min(6, "A senha deve possuir no mínimo 6 caracteres!"),
});

export type SignInSchema = z.infer<typeof signInSchema>;

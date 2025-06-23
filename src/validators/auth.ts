import { z } from "zod";

export const signInSchema = z.object({
  email: z.string(),
  password: z.string().min(6, "A senha deve possuir no mínimo 6 caracteres!"),
});

export type SignInSchema = z.infer<typeof signInSchema>;

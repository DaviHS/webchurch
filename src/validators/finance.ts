import { z } from "zod";

const moneyString = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(v), "Valor inválido (use até 2 casas decimais)");

const positiveMoneyString = (message: string) =>
  moneyString(message).refine((v) => Number(v) > 0, "O valor deve ser maior que zero");

export const toCalendarDay = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const PAYMENT_METHODS = ["pix", "cash", "card", "transfer", "check"] as const;

export const financialCategorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  type: z.enum(TRANSACTION_TYPES),
  description: z.string().trim().max(500, "Máximo de 500 caracteres").optional(),
});

export const financialCategoryUpdateSchema = financialCategorySchema
  .omit({ type: true })
  .extend({ id: z.number().int().positive() });

export const financialTransactionSchema = z.object({
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  type: z.enum(TRANSACTION_TYPES),
  amount: positiveMoneyString("Valor é obrigatório"),
  description: z.string().trim().min(1, "Descrição é obrigatória").max(255, "Máximo de 255 caracteres"),
  transactionDate: z.date().transform(toCalendarDay),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  referenceNumber: z.string().trim().max(100, "Máximo de 100 caracteres").optional(),
  notes: z.string().trim().max(1000, "Máximo de 1000 caracteres").optional(),
});

export const monthlyClosureSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  openingBalance: moneyString("Saldo inicial é obrigatório").optional(),
  notes: z.string().trim().max(1000, "Máximo de 1000 caracteres").optional(),
});

export const monthRefSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export type FinancialCategoryFormData = z.infer<typeof financialCategorySchema>;
export type FinancialTransactionFormData = z.infer<typeof financialTransactionSchema>;
export type FinancialTransactionFormInput = z.input<typeof financialTransactionSchema>;
export type MonthlyClosureFormData = z.infer<typeof monthlyClosureSchema>;
export type MonthlyClosureFormInput = z.input<typeof monthlyClosureSchema>;

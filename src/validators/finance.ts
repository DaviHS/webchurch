import { z } from "zod";

const moneyString = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(v), "Valor inválido (use até 2 casas decimais)");

const positiveMoneyString = (message: string) =>
  moneyString(message).refine((v) => Number(v) > 0, "O valor deve ser maior que zero");

export const financialCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
});

export const financialTransactionSchema = z.object({
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  type: z.enum(["income", "expense", "transfer"]),
  amount: positiveMoneyString("Valor é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  transactionDate: z.date(),
  paymentMethod: z.enum(["cash", "card", "transfer", "check"]).optional(),
  referenceNumber: z.string().optional(),
  memberId: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["weekly", "monthly", "yearly"]).optional(),
  notes: z.string().optional(),
});

export const monthlyClosureSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  openingBalance: moneyString("Saldo inicial é obrigatório"),
  notes: z.string().optional(),
});

export const budgetSchema = z.object({
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  allocatedAmount: positiveMoneyString("Valor alocado é obrigatório"),
  description: z.string().optional(),
});

export type FinancialCategoryFormData = z.infer<typeof financialCategorySchema>;
export type FinancialTransactionFormData = z.infer<typeof financialTransactionSchema>;
export type MonthlyClosureFormData = z.infer<typeof monthlyClosureSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;export type FinancialTransactionFormInput = z.input<typeof financialTransactionSchema>;

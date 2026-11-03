import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  financialCategories,
  financialTransactions,
  monthlyClosures,
  budgets,
  members,
  users,
} from "@/server/db/schema";
import { eq, desc, and, gte, lt, sum, count, type SQL } from "drizzle-orm";
import { addDays } from "date-fns";
import { financialCategorySchema, financialTransactionSchema, monthlyClosureSchema, budgetSchema } from "@/validators/finance";

const monthRange = (month: number, year: number) => ({
  startDate: new Date(year, month - 1, 1),
  endDate: new Date(year, month, 1),
});

const dateFilters = (startDate?: Date, endDate?: Date) => {
  const conditions: SQL[] = [];
  if (startDate) conditions.push(gte(financialTransactions.transactionDate, startDate));
  if (endDate) conditions.push(lt(financialTransactions.transactionDate, addDays(endDate, 1)));
  return conditions;
};

const toMoney = (value: number) => value.toFixed(2);

const assertMonthOpen = async (date: Date) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const [closure] = await db
    .select({ id: monthlyClosures.id })
    .from(monthlyClosures)
    .where(and(eq(monthlyClosures.month, month), eq(monthlyClosures.year, year)))
    .limit(1);

  if (closure) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `O mês ${String(month).padStart(2, "0")}/${year} já foi fechado e não aceita alterações.`,
    });
  }
};

export const financeRouter = createTRPCRouter({
  listCategories: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const whereConditions = [eq(financialCategories.isActive, true)];
      if (input.type) whereConditions.push(eq(financialCategories.type, input.type));

      return await db
        .select()
        .from(financialCategories)
        .where(and(...whereConditions))
        .orderBy(financialCategories.name);
    }),

  createCategory: protectedProcedure
    .input(financialCategorySchema)
    .mutation(async ({ input }) => {
      const [category] = await db
        .insert(financialCategories)
        .values(input)
        .returning();
      return category;
    }),

  listTransactions: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      type: z.string().optional(),
      categoryId: z.number().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate, type, categoryId, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = dateFilters(startDate, endDate);
      if (type) whereConditions.push(eq(financialTransactions.type, type));
      if (categoryId) whereConditions.push(eq(financialTransactions.categoryId, categoryId));

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [data, total] = await Promise.all([
        db
          .select({
            transaction: financialTransactions,
            category: financialCategories,
            member: members,
          })
          .from(financialTransactions)
          .where(where)
          .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
          .leftJoin(members, eq(financialTransactions.memberId, members.id))
          .orderBy(desc(financialTransactions.transactionDate))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(financialTransactions)
          .where(where),
      ]);

      const totalCount = total[0]?.count ?? 0;

      return {
        transactions: data,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  createTransaction: protectedProcedure
    .input(financialTransactionSchema)
    .mutation(async ({ input }) => {
      await assertMonthOpen(input.transactionDate);

      const [transaction] = await db
        .insert(financialTransactions)
        .values({ ...input, amount: toMoney(Number(input.amount)) })
        .returning();
      return transaction;
    }),

  updateTransaction: protectedProcedure
    .input(financialTransactionSchema.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const [current] = await db
        .select({ transactionDate: financialTransactions.transactionDate })
        .from(financialTransactions)
        .where(eq(financialTransactions.id, id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada" });
      }

      await assertMonthOpen(current.transactionDate);
      await assertMonthOpen(data.transactionDate);

      const [transaction] = await db
        .update(financialTransactions)
        .set({
          ...data,
          amount: toMoney(Number(data.amount)),
          paymentMethod: data.paymentMethod ?? null,
          referenceNumber: data.referenceNumber ?? null,
          memberId: data.memberId ?? null,
          recurrencePattern: data.recurrencePattern ?? null,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(financialTransactions.id, id))
        .returning();
      return transaction;
    }),

  getFinancialSummary: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const summary = await db
        .select({
          type: financialTransactions.type,
          total: sum(financialTransactions.amount),
        })
        .from(financialTransactions)
        .where(and(...dateFilters(startDate, endDate)))
        .groupBy(financialTransactions.type);

      const totalIncome = parseFloat(summary.find(s => s.type === 'income')?.total ?? '0');
      const totalExpenses = parseFloat(summary.find(s => s.type === 'expense')?.total ?? '0');

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      };
    }),

  getMonthlyReport: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = monthRange(input.month, input.year);
      const inMonth = and(
        gte(financialTransactions.transactionDate, startDate),
        lt(financialTransactions.transactionDate, endDate)
      );

      const [transactions, summary] = await Promise.all([
        db
          .select({
            transaction: financialTransactions,
            category: financialCategories,
            member: members,
          })
          .from(financialTransactions)
          .where(inMonth)
          .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
          .leftJoin(members, eq(financialTransactions.memberId, members.id))
          .orderBy(desc(financialTransactions.transactionDate)),
        db
          .select({
            type: financialTransactions.type,
            total: sum(financialTransactions.amount),
          })
          .from(financialTransactions)
          .where(inMonth)
          .groupBy(financialTransactions.type),
      ]);

      return {
        transactions,
        summary,
      };
    }),

  closeMonth: protectedProcedure
    .input(monthlyClosureSchema)
    .mutation(async ({ input, ctx }) => {
      const { month, year, openingBalance, notes } = input;
      const { startDate, endDate } = monthRange(month, year);

      const [existing] = await db
        .select({ id: monthlyClosures.id })
        .from(monthlyClosures)
        .where(and(eq(monthlyClosures.month, month), eq(monthlyClosures.year, year)))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `O mês ${String(month).padStart(2, "0")}/${year} já foi fechado.`,
        });
      }

      const summary = await db
        .select({
          type: financialTransactions.type,
          total: sum(financialTransactions.amount),
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.transactionDate, startDate),
            lt(financialTransactions.transactionDate, endDate)
          )
        )
        .groupBy(financialTransactions.type);

      const opening = Number(openingBalance);
      const totalIncome = parseFloat(summary.find(s => s.type === 'income')?.total ?? '0');
      const totalExpenses = parseFloat(summary.find(s => s.type === 'expense')?.total ?? '0');
      const closingBalance = opening + totalIncome - totalExpenses;

      const userId = Number(ctx.session.user.id);

      const [closure] = await db
        .insert(monthlyClosures)
        .values({
          month,
          year,
          openingBalance: toMoney(opening),
          totalIncome: toMoney(totalIncome),
          totalExpenses: toMoney(totalExpenses),
          closingBalance: toMoney(closingBalance),
          status: 'closed',
          closedAt: new Date(),
          closedBy: Number.isInteger(userId) ? userId : null,
          notes,
        })
        .returning();

      return closure;
    }),

  listMonthlyClosures: protectedProcedure
    .input(z.object({
      year: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await db
        .select({
          closure: monthlyClosures,
          closedByUser: {
            id: users.id,
            email: users.email,
          },
        })
        .from(monthlyClosures)
        .where(input.year ? eq(monthlyClosures.year, input.year) : undefined)
        .leftJoin(users, eq(monthlyClosures.closedBy, users.id))
        .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month));
    }),

  createBudget: protectedProcedure
    .input(budgetSchema)
    .mutation(async ({ input }) => {
      const [budget] = await db
        .insert(budgets)
        .values({
          ...input,
          allocatedAmount: toMoney(Number(input.allocatedAmount)),
          actualAmount: '0',
        })
        .returning();
      return budget;
    }),

  listBudgets: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
    }))
    .query(async ({ input }) => {
      return await db
        .select({
          budget: budgets,
          category: financialCategories,
        })
        .from(budgets)
        .where(
          and(
            eq(budgets.month, input.month),
            eq(budgets.year, input.year)
          )
        )
        .leftJoin(financialCategories, eq(budgets.categoryId, financialCategories.id));
    }),
});

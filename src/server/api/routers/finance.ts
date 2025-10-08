import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  financialCategories,
  financialTransactions,
  monthlyClosures,
  budgets,
  members,
  users,
} from "@/server/db/schema";
import { eq, desc, and, gte, lte, sql, sum } from "drizzle-orm";
import { financialCategorySchema, financialTransactionSchema, monthlyClosureSchema, budgetSchema } from "@/validators/finance";

export const financeRouter = createTRPCRouter({
  // Categories
  listCategories: publicProcedure
    .input(z.object({
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const whereConditions = [];
      if (input.type) whereConditions.push(eq(financialCategories.type, input.type));
      whereConditions.push(eq(financialCategories.isActive, true));

      return await db
        .select()
        .from(financialCategories)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
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

  // Transactions
  listTransactions: publicProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      type: z.string().optional(),
      categoryId: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate, type, categoryId, page, limit } = input;
      const offset = (page - 1) * limit;

      const whereConditions = [];
      if (startDate) whereConditions.push(gte(financialTransactions.transactionDate, startDate));
      if (endDate) whereConditions.push(lte(financialTransactions.transactionDate, endDate));
      if (type) whereConditions.push(eq(financialTransactions.type, type));
      if (categoryId) whereConditions.push(eq(financialTransactions.categoryId, categoryId));

      const [data, total] = await Promise.all([
        db
          .select({
            transaction: financialTransactions,
            category: financialCategories,
            member: members,
          })
          .from(financialTransactions)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
          .leftJoin(members, eq(financialTransactions.memberId, members.id))
          .orderBy(desc(financialTransactions.transactionDate))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(financialTransactions)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined),
      ]);

      return {
        transactions: data,
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / limit),
        currentPage: page,
      };
    }),

  createTransaction: protectedProcedure
    .input(financialTransactionSchema)
    .mutation(async ({ input }) => {
      const processedData = {
        ...input,
        amount: input.amount,
        transactionDate: input.transactionDate instanceof Date ? input.transactionDate : new Date(input.transactionDate),
      };

      const [transaction] = await db
        .insert(financialTransactions)
        .values(processedData)
        .returning();
      return transaction;
    }),

  // Dashboard Summary
  getFinancialSummary: publicProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      
      const whereConditions = [];
      if (startDate) whereConditions.push(gte(financialTransactions.transactionDate, startDate));
      if (endDate) whereConditions.push(lte(financialTransactions.transactionDate, endDate));

      const [incomeResult, expenseResult] = await Promise.all([
        db
          .select({ total: sum(financialTransactions.amount) })
          .from(financialTransactions)
          .where(
            and(
              ...whereConditions,
              eq(financialTransactions.type, 'income')
            )
          ),
        db
          .select({ total: sum(financialTransactions.amount) })
          .from(financialTransactions)
          .where(
            and(
              ...whereConditions,
              eq(financialTransactions.type, 'expense')
            )
          ),
      ]);

      const totalIncome = parseFloat(incomeResult[0]?.total || '0');
      const totalExpenses = parseFloat(expenseResult[0]?.total || '0');
      const balance = totalIncome - totalExpenses;

      return {
        totalIncome,
        totalExpenses,
        balance,
      };
    }),

  // Monthly Reports
  getMonthlyReport: publicProcedure
    .input(z.object({
      month: z.number(),
      year: z.number(),
    }))
    .query(async ({ input }) => {
      const { month, year } = input;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const transactions = await db
        .select({
          transaction: financialTransactions,
          category: financialCategories,
          member: members,
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.transactionDate, startDate),
            lte(financialTransactions.transactionDate, endDate)
          )
        )
        .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
        .leftJoin(members, eq(financialTransactions.memberId, members.id))
        .orderBy(desc(financialTransactions.transactionDate));

      const summary = await db
        .select({
          type: financialTransactions.type,
          total: sum(financialTransactions.amount),
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.transactionDate, startDate),
            lte(financialTransactions.transactionDate, endDate)
          )
        )
        .groupBy(financialTransactions.type);

      return {
        transactions,
        summary,
      };
    }),

  // Close Month - FIXED VERSION
  closeMonth: protectedProcedure
    .input(monthlyClosureSchema)
    .mutation(async ({ input, ctx }) => {
      const { month, year, openingBalance, notes } = input;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const summary = await db
        .select({
          type: financialTransactions.type,
          total: sum(financialTransactions.amount),
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.transactionDate, startDate),
            lte(financialTransactions.transactionDate, endDate)
          )
        )
        .groupBy(financialTransactions.type);

      const totalIncome = parseFloat(summary.find(s => s.type === 'income')?.total || '0');
      const totalExpenses = parseFloat(summary.find(s => s.type === 'expense')?.total || '0');
      const closingBalance = parseFloat(openingBalance) + totalIncome - totalExpenses;

      // Get current user ID - adjust based on your auth setup
      const currentUser = await db.select().from(users).where(eq(users.email, ctx.session?.user?.email || '')).then(res => res[0]);
      
      const [closure] = await db
        .insert(monthlyClosures)
        .values({
          month,
          year,
          openingBalance: parseFloat(openingBalance).toString(),
          totalIncome: totalIncome.toString(),
          totalExpenses: totalExpenses.toString(),
          closingBalance: closingBalance.toString(),
          status: 'closed',
          closedAt: new Date(),
          closedBy: currentUser?.id || 1, // Fallback to admin user
          notes,
        })
        .returning();

      return closure;
    }),

  // Additional useful procedures
  getMonthlyClosures: publicProcedure
    .input(z.object({
      year: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const whereConditions = [];
      if (input.year) whereConditions.push(eq(monthlyClosures.year, input.year));

      return await db
        .select({
          closure: monthlyClosures,
          closedByUser: users,
        })
        .from(monthlyClosures)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .leftJoin(users, eq(monthlyClosures.closedBy, users.id))
        .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month));
    }),

  // Budget management
  createBudget: protectedProcedure
    .input(budgetSchema)
    .mutation(async ({ input }) => {
      const processedData = {
        ...input,
        allocatedAmount: input.allocatedAmount,
        actualAmount: '0', // Start with zero
      };

      const [budget] = await db
        .insert(budgets)
        .values(processedData)
        .returning();
      return budget;
    }),

  getBudgets: publicProcedure
    .input(z.object({
      month: z.number(),
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
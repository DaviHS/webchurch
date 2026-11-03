import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, lt, or, sql, sum, type SQL } from "drizzle-orm";
import { addDays } from "date-fns";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { db } from "@/server/db";
import { financialCategories, financialTransactions, members, monthlyClosures, users } from "@/server/db/schema";
import {
  financialCategorySchema,
  financialCategoryUpdateSchema,
  financialTransactionSchema,
  monthlyClosureSchema,
  monthRefSchema,
} from "@/validators/finance";

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense" }[] = [
  { name: "Dízimos", type: "income" },
  { name: "Ofertas", type: "income" },
  { name: "Missões", type: "income" },
  { name: "Outras entradas", type: "income" },
  { name: "Água e luz", type: "expense" },
  { name: "Aluguel", type: "expense" },
  { name: "Manutenção", type: "expense" },
  { name: "Ação social", type: "expense" },
  { name: "Outras saídas", type: "expense" },
];

type MonthRef = { month: number; year: number };

const monthRange = ({ month, year }: MonthRef) => ({
  startDate: new Date(Date.UTC(year, month - 1, 1)),
  endDate: new Date(Date.UTC(year, month, 1)),
});

const monthOf = (date: Date): MonthRef => ({ month: date.getUTCMonth() + 1, year: date.getUTCFullYear() });

const previousMonth = ({ month, year }: MonthRef): MonthRef =>
  month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };

const monthIndex = ({ month, year }: MonthRef) => year * 12 + (month - 1);

const formatMonth = ({ month, year }: MonthRef) => `${String(month).padStart(2, "0")}/${year}`;

const toCents = (value: string | number | null | undefined) => Math.round(Number(value ?? 0) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

const inMonth = (ref: MonthRef) => {
  const { startDate, endDate } = monthRange(ref);
  return and(gte(financialTransactions.transactionDate, startDate), lt(financialTransactions.transactionDate, endDate));
};

const dateFilters = (startDate?: Date, endDate?: Date) => {
  const conditions: SQL[] = [];
  if (startDate) conditions.push(gte(financialTransactions.transactionDate, startDate));
  if (endDate) conditions.push(lt(financialTransactions.transactionDate, addDays(endDate, 1)));
  return conditions;
};

async function totalsInCents(where: SQL | undefined) {
  const rows = await db
    .select({ type: financialTransactions.type, total: sum(financialTransactions.amount) })
    .from(financialTransactions)
    .where(where)
    .groupBy(financialTransactions.type);
  const income = toCents(rows.find((r) => r.type === "income")?.total);
  const expense = toCents(rows.find((r) => r.type === "expense")?.total);
  return { income, expense };
}

const closureFor = (ref: MonthRef) =>
  db
    .select()
    .from(monthlyClosures)
    .where(and(eq(monthlyClosures.month, ref.month), eq(monthlyClosures.year, ref.year)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

async function latestClosure() {
  const [row] = await db
    .select()
    .from(monthlyClosures)
    .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month))
    .limit(1);
  return row ?? null;
}

async function latestClosureBefore(ref: MonthRef) {
  const [row] = await db
    .select()
    .from(monthlyClosures)
    .where(
      or(
        lt(monthlyClosures.year, ref.year),
        and(eq(monthlyClosures.year, ref.year), lt(monthlyClosures.month, ref.month))
      )
    )
    .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month))
    .limit(1);
  return row ?? null;
}

async function assertMonthOpen(date: Date) {
  const ref = monthOf(date);
  if (await closureFor(ref)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `O mês ${formatMonth(ref)} está fechado. Reabra o mês para alterar os lançamentos.`,
    });
  }
}

async function assertCategoryMatches(categoryId: number, type: string) {
  const [category] = await db
    .select({ type: financialCategories.type })
    .from(financialCategories)
    .where(eq(financialCategories.id, categoryId))
    .limit(1);
  if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "Categoria não encontrada." });
  if (category.type !== type) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A categoria não corresponde ao tipo do lançamento." });
  }
}

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";

export const financeRouter = createTRPCRouter({
  listCategories: adminProcedure
    .input(z.object({ type: z.enum(["income", "expense"]).optional(), includeInactive: z.boolean().default(false) }))
    .query(({ input }) => {
      const conditions: SQL[] = [];
      if (!input.includeInactive) conditions.push(eq(financialCategories.isActive, true));
      if (input.type) conditions.push(eq(financialCategories.type, input.type));
      return db
        .select()
        .from(financialCategories)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(financialCategories.type), asc(financialCategories.name));
    }),

  createCategory: adminProcedure.input(financialCategorySchema).mutation(async ({ input }) => {
    const [category] = await db.insert(financialCategories).values(input).returning();
    return category;
  }),

  updateCategory: adminProcedure.input(financialCategoryUpdateSchema).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const [category] = await db
      .update(financialCategories)
      .set({ ...data, description: data.description ?? null, updatedAt: new Date() })
      .where(eq(financialCategories.id, id))
      .returning();
    if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada." });
    return category;
  }),

  setCategoryActive: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const [category] = await db
        .update(financialCategories)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(financialCategories.id, input.id))
        .returning();
      if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada." });
      return category;
    }),

  createDefaultCategories: adminProcedure.mutation(async () => {
    const [existing] = await db.select({ count: count() }).from(financialCategories);
    if ((existing?.count ?? 0) > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Já existem categorias cadastradas." });
    }
    return db.insert(financialCategories).values(DEFAULT_CATEGORIES).returning();
  }),

  listTransactions: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(["income", "expense"]).optional(),
        categoryId: z.number().optional(),
        search: z.string().trim().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, type, categoryId, search, page, limit } = input;
      const conditions = dateFilters(startDate, endDate);
      if (type) conditions.push(eq(financialTransactions.type, type));
      if (categoryId) conditions.push(eq(financialTransactions.categoryId, categoryId));
      if (search) conditions.push(sql`${financialTransactions.description} ILIKE ${`%${search}%`}`);
      const where = conditions.length ? and(...conditions) : undefined;

      const [rows, total] = await Promise.all([
        db
          .select({
            transaction: financialTransactions,
            category: { id: financialCategories.id, name: financialCategories.name, type: financialCategories.type },
            member: { id: members.id, firstName: members.firstName, lastName: members.lastName },
          })
          .from(financialTransactions)
          .where(where)
          .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
          .leftJoin(members, eq(financialTransactions.memberId, members.id))
          .orderBy(desc(financialTransactions.transactionDate), desc(financialTransactions.id))
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ count: count() }).from(financialTransactions).where(where),
      ]);

      const totalCount = total[0]?.count ?? 0;
      return { transactions: rows, total: totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
    }),

  createTransaction: adminProcedure.input(financialTransactionSchema).mutation(async ({ input }) => {
    await Promise.all([assertMonthOpen(input.transactionDate), assertCategoryMatches(input.categoryId, input.type)]);
    const [transaction] = await db
      .insert(financialTransactions)
      .values({ ...input, amount: fromCents(toCents(input.amount)) })
      .returning();
    return transaction;
  }),

  updateTransaction: adminProcedure
    .input(financialTransactionSchema.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [current] = await db
        .select({ transactionDate: financialTransactions.transactionDate })
        .from(financialTransactions)
        .where(eq(financialTransactions.id, id))
        .limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Lançamento não encontrado." });

      await Promise.all([
        assertMonthOpen(current.transactionDate),
        assertMonthOpen(data.transactionDate),
        assertCategoryMatches(data.categoryId, data.type),
      ]);

      const [transaction] = await db
        .update(financialTransactions)
        .set({
          ...data,
          amount: fromCents(toCents(data.amount)),
          paymentMethod: data.paymentMethod ?? null,
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(financialTransactions.id, id))
        .returning();
      return transaction;
    }),

  deleteTransaction: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const [current] = await db
      .select({ transactionDate: financialTransactions.transactionDate })
      .from(financialTransactions)
      .where(eq(financialTransactions.id, input.id))
      .limit(1);
    if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Lançamento não encontrado." });
    await assertMonthOpen(current.transactionDate);
    await db.delete(financialTransactions).where(eq(financialTransactions.id, input.id));
    return { success: true };
  }),

  getFinancialSummary: adminProcedure
    .input(z.object({ startDate: z.date().optional(), endDate: z.date().optional() }))
    .query(async ({ input }) => {
      const conditions = dateFilters(input.startDate, input.endDate);
      const { income, expense } = await totalsInCents(conditions.length ? and(...conditions) : undefined);
      return { totalIncome: income / 100, totalExpenses: expense / 100, balance: (income - expense) / 100 };
    }),

  getMonthSummary: adminProcedure.input(monthRefSchema).query(async ({ input }) => {
    const prev = previousMonth(input);
    const [current, previous, byCategory, transactions, closure, previousClosure, latest] = await Promise.all([
      totalsInCents(inMonth(input)),
      totalsInCents(inMonth(prev)),
      db
        .select({
          categoryId: financialTransactions.categoryId,
          name: financialCategories.name,
          type: financialTransactions.type,
          total: sum(financialTransactions.amount),
          count: count(),
        })
        .from(financialTransactions)
        .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
        .where(inMonth(input))
        .groupBy(financialTransactions.categoryId, financialCategories.name, financialTransactions.type),
      db
        .select({
          id: financialTransactions.id,
          date: financialTransactions.transactionDate,
          description: financialTransactions.description,
          type: financialTransactions.type,
          amount: financialTransactions.amount,
          paymentMethod: financialTransactions.paymentMethod,
          categoryName: financialCategories.name,
        })
        .from(financialTransactions)
        .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
        .where(inMonth(input))
        .orderBy(asc(financialTransactions.transactionDate), asc(financialTransactions.id)),
      closureFor(input),
      latestClosureBefore(input),
      latestClosure(),
    ]);

    const openingCents = closure ? toCents(closure.openingBalance) : previousClosure ? toCents(previousClosure.closingBalance) : null;
    const closingCents = openingCents === null ? null : openingCents + current.income - current.expense;
    const today = monthOf(new Date());

    return {
      month: input.month,
      year: input.year,
      income: current.income / 100,
      expense: current.expense / 100,
      result: (current.income - current.expense) / 100,
      previous: { income: previous.income / 100, expense: previous.expense / 100 },
      openingBalance: openingCents === null ? null : openingCents / 100,
      closingBalance: closingCents === null ? null : closingCents / 100,
      hasPreviousClosure: previousClosure !== null,
      byCategory: byCategory
        .map((row) => ({ ...row, name: row.name ?? "Sem categoria", total: toCents(row.total) / 100 }))
        .sort((a, b) => b.total - a.total),
      transactions: transactions.map((t) => ({ ...t, amount: toCents(t.amount) / 100 })),
      closure: closure
        ? { closedAt: closure.closedAt, notes: closure.notes, closingBalance: toCents(closure.closingBalance) / 100 }
        : null,
      isFuture: monthIndex(input) > monthIndex(today),
      canClose: !closure && monthIndex(input) <= monthIndex(today) && (!latest || monthIndex(latest) < monthIndex(input)),
      canReopen: Boolean(closure && latest && monthIndex(latest) === monthIndex(input)),
    };
  }),

  closeMonth: adminProcedure.input(monthlyClosureSchema).mutation(async ({ input, ctx }) => {
    const ref = { month: input.month, year: input.year };
    if (monthIndex(ref) > monthIndex(monthOf(new Date()))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível fechar um mês que ainda não começou." });
    }

    const latest = await latestClosure();
    if (latest && monthIndex(latest) >= monthIndex(ref)) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          monthIndex(latest) === monthIndex(ref)
            ? `O mês ${formatMonth(ref)} já foi fechado.`
            : `Já existe fechamento de ${formatMonth(latest)}. Feche os meses em ordem.`,
      });
    }

    const previousClosure = await latestClosureBefore(ref);
    if (!previousClosure && input.openingBalance === undefined) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o saldo inicial do primeiro fechamento." });
    }

    const opening = previousClosure ? toCents(previousClosure.closingBalance) : toCents(input.openingBalance);
    const { income, expense } = await totalsInCents(inMonth(ref));
    const userId = Number(ctx.session.user.id);

    try {
      const [closure] = await db
        .insert(monthlyClosures)
        .values({
          month: ref.month,
          year: ref.year,
          openingBalance: fromCents(opening),
          totalIncome: fromCents(income),
          totalExpenses: fromCents(expense),
          closingBalance: fromCents(opening + income - expense),
          status: "closed",
          closedAt: new Date(),
          closedBy: Number.isInteger(userId) ? userId : null,
          notes: input.notes,
        })
        .returning();
      return closure;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new TRPCError({ code: "CONFLICT", message: `O mês ${formatMonth(ref)} já foi fechado.` });
      }
      throw error;
    }
  }),

  reopenMonth: adminProcedure.input(monthRefSchema).mutation(async ({ input }) => {
    const latest = await latestClosure();
    if (!latest || monthIndex(latest) !== monthIndex(input)) {
      throw new TRPCError({ code: "CONFLICT", message: "Só é possível reabrir o último mês fechado." });
    }
    await db.delete(monthlyClosures).where(eq(monthlyClosures.id, latest.id));
    return { success: true };
  }),

  listMonthlyClosures: adminProcedure.query(() =>
    db
      .select({
        closure: monthlyClosures,
        closedBy: { email: users.email, firstName: members.firstName, lastName: members.lastName },
      })
      .from(monthlyClosures)
      .leftJoin(users, eq(monthlyClosures.closedBy, users.id))
      .leftJoin(members, eq(users.memberId, members.id))
      .orderBy(desc(monthlyClosures.year), desc(monthlyClosures.month))
  ),
});

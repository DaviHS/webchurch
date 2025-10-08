// server/db/schema.ts
import { pgTableCreator, pgEnum } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"

export const createTable = pgTableCreator((name) => `${name}`)

export const memberStatusEnum = pgEnum("member_status", ["active", "inactive", "visiting", "transferred"])
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"])
export const genderEnum = pgEnum("gender", ["male", "female"])
export const eventTypeEnum = pgEnum("event_type", [
  "cult", 
  "celebration", 
  "meeting", 
  "conference", 
  "rehearsal",
  "other",
  "template"
])
export const songCategoryEnum = pgEnum("song_category", [
  "hymn",
  "praise",
  "worship",
  "chorus",
  "special"
])
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "inactive"])

// Ministérios
export const ministries = createTable("ministries", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull().unique(),
  description: d.text("description"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Funções
export const functions = createTable("functions", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull().unique(),
  description: d.text("description"),
  displayOrder: d.integer("display_order").default(0),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Relacionamento Ministério-Função (quais funções são permitidas em cada ministério)
export const ministryFunctions = createTable("ministry_functions", (d) => ({
  id: d.serial("id").primaryKey(),
  ministryId: d.integer("ministry_id").notNull().references(() => ministries.id),
  functionId: d.integer("function_id").notNull().references(() => functions.id),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Membros
export const members = createTable("members", (d) => ({
  id: d.serial("id").primaryKey(),
  firstName: d.varchar("first_name", { length: 50 }).notNull(),
  lastName: d.varchar("last_name", { length: 50 }).notNull(),
  email: d.varchar("email", { length: 100 }).unique(),
  phone: d.varchar("phone", { length: 20 }),
  whatsapp: d.varchar("whatsapp", { length: 20 }),
  birthDate: d.date("birth_date"),
  gender: genderEnum("gender"),
  maritalStatus: maritalStatusEnum("marital_status"),
  address: d.text("address"),
  city: d.varchar("city", { length: 50 }),
  state: d.varchar("state", { length: 2 }),
  zipCode: d.varchar("zip_code", { length: 10 }),
  baptismDate: d.date("baptism_date"),
  memberSince: d.date("member_since"),
  status: memberStatusEnum("status").notNull().default("active"),
  profession: d.varchar("profession", { length: 100 }),
  emergencyContact: d.varchar("emergency_contact", { length: 100 }),
  emergencyPhone: d.varchar("emergency_phone", { length: 20 }),
  notes: d.text("notes"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Relacionamento Membro-Ministério
export const memberMinistries = createTable("member_ministries", (d) => ({
  id: d.serial("id").primaryKey(),
  memberId: d.integer("member_id").notNull().references(() => members.id),
  ministryId: d.integer("ministry_id").notNull().references(() => ministries.id),
  functionId: d.integer("function_id").references(() => functions.id),
  joinedAt: d.timestamp("joined_at").notNull().defaultNow(),
  leftAt: d.timestamp("left_at"),
  isActive: d.boolean("is_active").notNull().default(true),
  notes: d.text("notes"),
}))

// Usuários
export const users = createTable("users", (d) => ({
  id: d.serial("id").primaryKey(),
  memberId: d.integer("member_id").references(() => members.id),
  email: d.varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: d.varchar("password_hash", { length: 100 }).notNull(),
  passwordCreatedAt: d.timestamp("password_created_at", { mode: "date", withTimezone: true }),
  passwordUpdatedAt: d.timestamp("password_updated_at", { mode: "date", withTimezone: true }),
  isAdmin: d.boolean("is_admin").notNull().default(false),
  status: userStatusEnum("status").notNull().default("pending"),
  approvedAt: d.timestamp("approved_at"),
  lastLogin: d.timestamp("last_login"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  resetToken: d.varchar("reset_token", { length: 100 }),
  resetTokenExpires: d.timestamp("reset_token_expires", { mode: "date", withTimezone: true }).defaultNow(),
}))

// Tabela de Músicas/Louvor
export const songs = createTable("songs", (d) => ({
  id: d.serial("id").primaryKey(),
  title: d.varchar("title", { length: 200 }).notNull(),
  artist: d.varchar("artist", { length: 100 }),
  category: songCategoryEnum("category").notNull().default("praise"),
  lyrics: d.text("lyrics"),
  chords: d.text("chords"),
  youtubeUrl: d.varchar("youtube_url", { length: 255 }),
  youtubeVideoId: d.varchar("youtube_video_id", { length: 20 }), 
  duration: d.integer("duration"), // em segundos
  bpm: d.integer("bpm"),
  key: d.varchar("key", { length: 10 }),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Tabela de Eventos
export const events = createTable("events", (d) => ({
  id: d.serial("id").primaryKey(),
  title: d.varchar("title", { length: 200 }).notNull(),
  description: d.text("description"),
  type: eventTypeEnum("type").notNull().default("cult"),
  date: d.timestamp("date").notNull(),
  startTime: d.time("start_time"),
  endTime: d.time("end_time"),
  location: d.varchar("location", { length: 200 }),
  preacher: d.varchar("preacher", { length: 100 }),
  bibleVerse: d.varchar("bible_verse", { length: 100 }),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Tabela de Músicas do Evento
export const eventSongs = createTable("event_songs", (d) => ({
  id: d.serial("id").primaryKey(),
  eventId: d.integer("event_id").notNull().references(() => events.id),
  songId: d.integer("song_id").notNull().references(() => songs.id),
  order: d.integer("order").notNull(),
  leaderId: d.integer("leader_id").references(() => members.id),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

// Tabela de Participantes do Evento (músicos, equipe de louvor)
export const eventParticipants = createTable("event_participants", (d) => ({
  id: d.serial("id").primaryKey(),
  eventId: d.integer("event_id").notNull().references(() => events.id),
  memberId: d.integer("member_id").notNull().references(() => members.id),
  role: d.varchar("role", { length: 50 }).notNull(), // vocal, guitarra, bateria, etc.
  instrument: d.varchar("instrument", { length: 50 }),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

// Financial Categories
export const financialCategories = createTable("financial_categories", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull(),
  type: d.varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  description: d.text("description"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

// Financial Transactions
export const financialTransactions = createTable("financial_transactions", (d) => ({
  id: d.serial("id").primaryKey(),
  categoryId: d.integer("category_id").notNull().references(() => financialCategories.id),
  type: d.varchar("type", { length: 20 }).notNull(), // 'income', 'expense', 'transfer'
  amount: d.numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: d.varchar("description", { length: 255 }).notNull(),
  transactionDate: d.timestamp("transaction_date").notNull().defaultNow(),
  paymentMethod: d.varchar("payment_method", { length: 50 }), // 'cash', 'card', 'transfer', 'check'
  referenceNumber: d.varchar("reference_number", { length: 100 }),
  memberId: d.integer("member_id").references(() => members.id),
  isRecurring: d.boolean("is_recurring").default(false),
  recurrencePattern: d.varchar("recurrence_pattern", { length: 50 }), // 'weekly', 'monthly', 'yearly'
  status: d.varchar("status", { length: 20 }).default('completed'), // 'pending', 'completed', 'cancelled'
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));

// Monthly Closures
export const monthlyClosures = createTable("monthly_closures", (d) => ({
  id: d.serial("id").primaryKey(),
  month: d.integer("month").notNull(),
  year: d.integer("year").notNull(),
  openingBalance: d.numeric("opening_balance", { precision: 10, scale: 2 }).notNull(),
  totalIncome: d.numeric("total_income", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: d.numeric("total_expenses", { precision: 10, scale: 2 }).notNull(),
  closingBalance: d.numeric("closing_balance", { precision: 10, scale: 2 }).notNull(),
  status: d.varchar("status", { length: 20 }).default('open'), // 'open', 'closed', 'locked'
  closedAt: d.timestamp("closed_at"),
  closedBy: d.integer("closed_by").references(() => users.id),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));

// Budgets
export const budgets = createTable("budgets", (d) => ({
  id: d.serial("id").primaryKey(),
  categoryId: d.integer("category_id").notNull().references(() => financialCategories.id),
  month: d.integer("month").notNull(),
  year: d.integer("year").notNull(),
  allocatedAmount: d.numeric("allocated_amount", { precision: 10, scale: 2 }).notNull(),
  actualAmount: d.numeric("actual_amount", { precision: 10, scale: 2 }),
  description: d.text("description"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));

// Relações
export const membersRelations = relations(members, ({ many, one }) => ({
  memberMinistries: many(memberMinistries),
  user: one(users, {
    fields: [members.id],
    references: [users.memberId],
  }),
  eventSongs: many(eventSongs, { relationName: "song_leader" }),
  eventParticipants: many(eventParticipants),
}))

export const ministriesRelations = relations(ministries, ({ many }) => ({
  memberMinistries: many(memberMinistries),
  ministryFunctions: many(ministryFunctions),
}))

export const functionsRelations = relations(functions, ({ many }) => ({
  memberMinistries: many(memberMinistries),
  ministryFunctions: many(ministryFunctions),
}))

export const ministryFunctionsRelations = relations(ministryFunctions, ({ one }) => ({
  ministry: one(ministries, {
    fields: [ministryFunctions.ministryId],
    references: [ministries.id],
  }),
  function: one(functions, {
    fields: [ministryFunctions.functionId],
    references: [functions.id],
  }),
}))

export const memberMinistriesRelations = relations(memberMinistries, ({ one }) => ({
  member: one(members, {
    fields: [memberMinistries.memberId],
    references: [members.id],
  }),
  ministry: one(ministries, {
    fields: [memberMinistries.ministryId],
    references: [ministries.id],
  }),
  function: one(functions, {
    fields: [memberMinistries.functionId],
    references: [functions.id],
  }),
}))

export const usersRelations = relations(users, ({ one }) => ({
  member: one(members, {
    fields: [users.memberId],
    references: [members.id],
  }),
}))

export const songsRelations = relations(songs, ({ many }) => ({
  eventSongs: many(eventSongs),
}))

export const eventsRelations = relations(events, ({ many }) => ({
  eventSongs: many(eventSongs),
  eventParticipants: many(eventParticipants),
}))

export const eventSongsRelations = relations(eventSongs, ({ one }) => ({
  event: one(events, {
    fields: [eventSongs.eventId],
    references: [events.id],
  }),
  song: one(songs, {
    fields: [eventSongs.songId],
    references: [songs.id],
  }),
  leader: one(members, {
    fields: [eventSongs.leaderId],
    references: [members.id],
    relationName: "song_leader",
  }),
}))

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  member: one(members, {
    fields: [eventParticipants.memberId],
    references: [members.id],
  }),
}))

// Tipos TypeScript
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Ministry = typeof ministries.$inferSelect
export type NewMinistry = typeof ministries.$inferInsert
export type Function = typeof functions.$inferSelect
export type NewFunction = typeof functions.$inferInsert
export type MinistryFunction = typeof ministryFunctions.$inferSelect
export type NewMinistryFunction = typeof ministryFunctions.$inferInsert
export type MemberMinistry = typeof memberMinistries.$inferSelect
export type NewMemberMinistry = typeof memberMinistries.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Song = typeof songs.$inferSelect
export type NewSong = typeof songs.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type EventSong = typeof eventSongs.$inferSelect
export type NewEventSong = typeof eventSongs.$inferInsert
export type EventParticipant = typeof eventParticipants.$inferSelect
export type NewEventParticipant = typeof eventParticipants.$inferInsert
export type MonthlyClosures = typeof monthlyClosures.$inferInsert;
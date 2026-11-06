import { pgTableCreator, pgEnum, uniqueIndex, primaryKey, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

export const ministries = createTable("ministries", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull().unique(),
  description: d.text("description"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

export const functions = createTable("functions", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull().unique(),
  description: d.text("description"),
  displayOrder: d.integer("display_order").default(0),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

export const ministryFunctions = createTable("ministry_functions", (d) => ({
  id: d.serial("id").primaryKey(),
  ministryId: d.integer("ministry_id").notNull().references(() => ministries.id),
  functionId: d.integer("function_id").notNull().references(() => functions.id),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

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
  bibleVersion: d.varchar("bible_version", { length: 10 }),
  bibleBook: d.integer("bible_book"),
  bibleChapter: d.integer("bible_chapter"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  resetToken: d.varchar("reset_token", { length: 100 }),
  resetTokenExpires: d.timestamp("reset_token_expires", { mode: "date", withTimezone: true }).defaultNow(),
}))

export const songs = createTable("songs", (d) => ({
  id: d.serial("id").primaryKey(),
  title: d.varchar("title", { length: 200 }).notNull(),
  artist: d.varchar("artist", { length: 100 }),
  category: songCategoryEnum("category").notNull().default("praise"),
  lyrics: d.text("lyrics"),
  chords: d.text("chords"),
  youtubeUrl: d.varchar("youtube_url", { length: 255 }),
  youtubeVideoId: d.varchar("youtube_video_id", { length: 20 }), 
  duration: d.integer("duration"),
  bpm: d.integer("bpm"),
  key: d.varchar("key", { length: 10 }),

  spotifyUrl: d.varchar("spotify_url", { length: 255 }),
  spotifyTrackId: d.varchar("spotify_track_id", { length: 50 }),

  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

export const functionPermissions = createTable(
  "function_permissions",
  (d) => ({
    functionId: d.integer("function_id").notNull().references(() => functions.id, { onDelete: "cascade" }),
    permission: d.varchar("permission", { length: 40 }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.functionId, t.permission] })],
)

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

export const eventPassages = createTable("event_passages", (d) => ({
  id: d.serial("id").primaryKey(),
  eventId: d.integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  reference: d.varchar("reference", { length: 60 }).notNull(),
  versionCode: d.varchar("version_code", { length: 10 }).notNull(),
  placement: d.varchar("placement", { length: 6 }).notNull().default("after"),
  order: d.integer("order").notNull(),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

export const eventSongs = createTable("event_songs", (d) => ({
  id: d.serial("id").primaryKey(),
  eventId: d.integer("event_id").notNull().references(() => events.id),
  songId: d.integer("song_id").notNull().references(() => songs.id),
  order: d.integer("order").notNull(),
  leaderId: d.integer("leader_id").references(() => members.id),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

export const eventParticipants = createTable("event_participants", (d) => ({
  id: d.serial("id").primaryKey(),
  eventId: d.integer("event_id").notNull().references(() => events.id),
  memberId: d.integer("member_id").notNull().references(() => members.id),
  role: d.varchar("role", { length: 50 }).notNull(),
  instrument: d.varchar("instrument", { length: 50 }),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

export const financialCategories = createTable("financial_categories", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull(),
  type: d.varchar("type", { length: 20 }).notNull(),
  description: d.text("description"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}))

export const financialTransactions = createTable("financial_transactions", (d) => ({
  id: d.serial("id").primaryKey(),
  categoryId: d.integer("category_id").notNull().references(() => financialCategories.id),
  type: d.varchar("type", { length: 20 }).notNull(),
  amount: d.numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: d.varchar("description", { length: 255 }).notNull(),
  transactionDate: d.timestamp("transaction_date").notNull().defaultNow(),
  paymentMethod: d.varchar("payment_method", { length: 50 }),
  referenceNumber: d.varchar("reference_number", { length: 100 }),
  memberId: d.integer("member_id").references(() => members.id),
  isRecurring: d.boolean("is_recurring").default(false),
  recurrencePattern: d.varchar("recurrence_pattern", { length: 50 }),
  status: d.varchar("status", { length: 20 }).default('completed'),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));

export const monthlyClosures = createTable("monthly_closures", (d) => ({
  id: d.serial("id").primaryKey(),
  month: d.integer("month").notNull(),
  year: d.integer("year").notNull(),
  openingBalance: d.numeric("opening_balance", { precision: 10, scale: 2 }).notNull(),
  totalIncome: d.numeric("total_income", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: d.numeric("total_expenses", { precision: 10, scale: 2 }).notNull(),
  closingBalance: d.numeric("closing_balance", { precision: 10, scale: 2 }).notNull(),
  status: d.varchar("status", { length: 20 }).default('open'),
  closedAt: d.timestamp("closed_at"),
  closedBy: d.integer("closed_by").references(() => users.id),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}), (t) => [uniqueIndex("monthly_closures_month_year_unique").on(t.month, t.year)]);

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

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Ministry = typeof ministries.$inferSelect
export type NewMinistry = typeof ministries.$inferInsert
export type MinistryRole = typeof functions.$inferSelect
export type NewMinistryRole = typeof functions.$inferInsert
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
export type MonthlyClosure = typeof monthlyClosures.$inferSelect;
export type NewMonthlyClosure = typeof monthlyClosures.$inferInsert;

export const bibleVersions = createTable("bible_versions", (d) => ({
  id: d.serial("id").primaryKey(),
  code: d.varchar("code", { length: 10 }).notNull().unique(),
  name: d.varchar("name", { length: 100 }).notNull(),
  language: d.varchar("language", { length: 5 }).notNull(),
  publisher: d.varchar("publisher", { length: 100 }),
  licenseNote: d.text("license_note"),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

export const bibleBooks = createTable("bible_books", (d) => ({
  id: d.integer("id").primaryKey(),
  testament: d.varchar("testament", { length: 2 }).notNull(),
  namePt: d.varchar("name_pt", { length: 50 }).notNull(),
  abbrevPt: d.varchar("abbrev_pt", { length: 10 }).notNull(),
  nameEn: d.varchar("name_en", { length: 50 }).notNull(),
  chapters: d.integer("chapters").notNull(),
}))

export const bibleVerses = createTable(
  "bible_verses",
  (d) => ({
    versionId: d.integer("version_id").notNull().references(() => bibleVersions.id, { onDelete: "cascade" }),
    bookId: d.integer("book_id").notNull().references(() => bibleBooks.id),
    chapter: d.integer("chapter").notNull(),
    verse: d.integer("verse").notNull(),
    text: d.text("text").notNull(),
  }),
  (t) => [primaryKey({ columns: [t.versionId, t.bookId, t.chapter, t.verse] })],
)

/** Títulos de seção de cada tradução (ex.: "A criação"). Só as traduções que os têm aparecem aqui. */
export const bibleHeadings = createTable(
  "bible_headings",
  (d) => ({
    versionId: d.integer("version_id").notNull().references(() => bibleVersions.id, { onDelete: "cascade" }),
    bookId: d.integer("book_id").notNull().references(() => bibleBooks.id),
    chapter: d.integer("chapter").notNull(),
    /** Versículo em que a seção começa. */
    verse: d.integer("verse").notNull(),
    title: d.varchar("title", { length: 200 }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.versionId, t.bookId, t.chapter, t.verse] })],
)

export type BibleVersion = typeof bibleVersions.$inferSelect
export type BibleBook = typeof bibleBooks.$inferSelect
export type BibleVerse = typeof bibleVerses.$inferSelect


export const presentationSessions = createTable("presentation_sessions", (d) => ({
  id: d.serial("id").primaryKey(),
  code: d.varchar("code", { length: 4 }).notNull().unique(),
  userId: d.integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deckKey: d.varchar("deck_key", { length: 100 }).notNull().default(""),
  title: d.varchar("title", { length: 200 }).notNull().default(""),
  state: d.jsonb("state"),
  outline: d.jsonb("outline"),
  outlineRev: d.integer("outline_rev").notNull().default(0),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  expiresAt: d.timestamp("expires_at").notNull(),
}), (t) => [uniqueIndex("presentation_sessions_user_deck_unique").on(t.userId, t.deckKey)])

export const presentationCommands = createTable("presentation_commands", (d) => ({
  id: d.serial("id").primaryKey(),
  sessionId: d.integer("session_id").notNull().references(() => presentationSessions.id, { onDelete: "cascade" }),
  command: d.jsonb("command").notNull(),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
}))

export const auditLogs = createTable(
  "audit_logs",
  (d) => ({
    id: d.serial("id").primaryKey(),
    userId: d.integer("user_id"),
    userLabel: d.varchar("user_label", { length: 150 }).notNull(),
    action: d.varchar("action", { length: 100 }).notNull(),
    target: d.text("target"),
    input: d.jsonb("input"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
  }),
  (t) => [index("audit_logs_created_at_idx").on(t.createdAt)],
)

export type AuditLog = typeof auditLogs.$inferSelect

export const bibleMarks = createTable(
  "bible_marks",
  (d) => ({
    userId: d.integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    bookId: d.integer("book_id").notNull().references(() => bibleBooks.id),
    chapter: d.integer("chapter").notNull(),
    verse: d.integer("verse").notNull(),
    color: d.varchar("color", { length: 10 }),
    note: d.text("note"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.bookId, t.chapter, t.verse] }), index("bible_marks_user_updated_idx").on(t.userId, t.updatedAt)],
)

export type BibleMark = typeof bibleMarks.$inferSelect


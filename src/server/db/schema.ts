import { pgTableCreator, pgEnum } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Criador de tabelas com convenção de nomes simples
export const createTable = pgTableCreator((name) => name)

// Enums
export const memberStatusEnum = pgEnum("member_status", ["active", "inactive", "visiting", "transferred"])
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"])
export const genderEnum = pgEnum("gender", ["male", "female"])

// Ministérios
export const ministries = createTable("ministries", (d) => ({
  id: d.serial("id").primaryKey(),
  name: d.varchar("name", { length: 100 }).notNull().unique(),
  description: d.text("description"),
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
  joinedAt: d.timestamp("joined_at").notNull().defaultNow(),
  leftAt: d.timestamp("left_at"),
  isActive: d.boolean("is_active").notNull().default(true),
  role: d.varchar("role", { length: 50 }),
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
  isActive: d.boolean("is_active").notNull().default(true),
  lastLogin: d.timestamp("last_login"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  resetToken: d.varchar("reset_token", { length: 100 }),
  resetTokenExpires: d.timestamp("reset_token_expires", { mode: "date", withTimezone: true }).defaultNow(),
}))

// Relações
export const membersRelations = relations(members, ({ many, one }) => ({
  memberMinistries: many(memberMinistries),
  user: one(users, {
    fields: [members.id],
    references: [users.memberId],
  }),
}))

export const ministriesRelations = relations(ministries, ({ many }) => ({
  memberMinistries: many(memberMinistries),
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
}))

export const usersRelations = relations(users, ({ one }) => ({
  member: one(members, {
    fields: [users.memberId],
    references: [members.id],
  }),
}))

// Tipos TypeScript
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Ministry = typeof ministries.$inferSelect
export type NewMinistry = typeof ministries.$inferInsert
export type MemberMinistry = typeof memberMinistries.$inferSelect
export type NewMemberMinistry = typeof memberMinistries.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

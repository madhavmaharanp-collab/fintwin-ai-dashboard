import { pgTable, text, serial, timestamp, numeric, jsonb, boolean, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// AUTH & USER MANAGEMENT
// ============================================================================

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
  index("idx_users_email").on(table.email),
]);

export const userProfilesTable = pgTable("user_profiles", {
  id: uuid("id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("USD"),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).default("0"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// FINANCIAL DATA
// ============================================================================

export const goalsTable = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  deadline: timestamp("deadline"),
  category: text("category"), // e.g., "savings", "investment", "debt-payoff"
  status: text("status").notNull().default("active"), // "active" | "completed" | "abandoned"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
  index("idx_goals_user_id").on(table.userId),
  index("idx_goals_status").on(table.status),
]);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "income" | "expense"
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
  index("idx_transactions_user_id").on(table.userId),
  index("idx_transactions_date").on(table.date),
]);

// ============================================================================
// AI CHAT & COACHING
// ============================================================================

export const aiChatsTable = pgTable("ai_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
  index("idx_ai_chats_user_id").on(table.userId),
]);

export const aiMessagesTable = pgTable("ai_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => aiChatsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  financialSnapshot: jsonb("financial_snapshot"), // snapshot of user's financial state at time of message
  chartData: jsonb("chart_data"), // optional chart response from AI
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [
  index("idx_ai_messages_chat_id").on(table.chatId),
  index("idx_ai_messages_user_id").on(table.userId),
]);

// ============================================================================
// SESSIONS & SECURITY
// ============================================================================

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [
  index("idx_sessions_user_id").on(table.userId),
  index("idx_sessions_expires_at").on(table.expiresAt),
]);

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;

export type Goal = typeof goalsTable.$inferSelect;
export type InsertGoal = typeof goalsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;

export type AiChat = typeof aiChatsTable.$inferSelect;
export type InsertAiChat = typeof aiChatsTable.$inferInsert;

export type AiMessage = typeof aiMessagesTable.$inferSelect;
export type InsertAiMessage = typeof aiMessagesTable.$inferInsert;

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;

// ============================================================================
// ZOD SCHEMAS (for API validation)
// ============================================================================

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiChatSchema = createInsertSchema(aiChatsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiMessageSchema = createInsertSchema(aiMessagesTable).omit({ id: true, createdAt: true });

// ============================================================================
// RELATIONS (for Drizzle queries)
// ============================================================================

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  profile: one(userProfilesTable, { fields: [usersTable.id], references: [userProfilesTable.id] }),
  goals: many(goalsTable),
  transactions: many(transactionsTable),
  aiChats: many(aiChatsTable),
  sessions: many(sessionsTable),
}));

export const userProfilesRelations = relations(userProfilesTable, ({ one }) => ({
  user: one(usersTable, { fields: [userProfilesTable.id], references: [usersTable.id] }),
}));

export const goalsRelations = relations(goalsTable, ({ one }) => ({
  user: one(usersTable, { fields: [goalsTable.userId], references: [usersTable.id] }),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, { fields: [transactionsTable.userId], references: [usersTable.id] }),
}));

export const aiChatsRelations = relations(aiChatsTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [aiChatsTable.userId], references: [usersTable.id] }),
  messages: many(aiMessagesTable),
}));

export const aiMessagesRelations = relations(aiMessagesTable, ({ one }) => ({
  chat: one(aiChatsTable, { fields: [aiMessagesTable.chatId], references: [aiChatsTable.id] }),
  user: one(usersTable, { fields: [aiMessagesTable.userId], references: [usersTable.id] }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, { fields: [sessionsTable.userId], references: [usersTable.id] }),
}));
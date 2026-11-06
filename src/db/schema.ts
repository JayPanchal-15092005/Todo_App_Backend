import { boolean, date, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  category: varchar("category", { length: 50 }).default("Personal").notNull(),
  due_date: varchar("due_date", { length: 50 }),
  due_time: varchar("due_time", { length: 20 }),
  is_completed: boolean("is_completed").default(false).notNull(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  reminder_enabled: boolean("reminder_enabled").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).default("Habit").notNull(),
  frequency: varchar("frequency", { length: 50 }).default("daily").notNull(),
  streak: integer("streak").default(0).notNull(),
  last_completed_date: date("last_completed_date"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;

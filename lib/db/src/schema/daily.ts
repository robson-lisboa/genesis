import { pgTable, text, serial, integer, boolean, jsonb, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const dailyChallengesTable = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull().default(200),
  coinReward: integer("coin_reward").notNull().default(50),
  difficulty: text("difficulty").notNull().default("Médio"),
  language: text("language").notNull().default("python"),
  starterCode: text("starter_code").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  challengeDate: date("challenge_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentDailyChallengesTable = pgTable("student_daily_challenges", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallengesTable.id),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallengesTable).omit({ id: true, createdAt: true });
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type DailyChallenge = typeof dailyChallengesTable.$inferSelect;

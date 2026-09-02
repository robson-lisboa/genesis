import { pgTable, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { missionsTable } from "./missions";
import { citiesTable } from "./cities";

export const missionProgressTable = pgTable("mission_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  missionId: integer("mission_id").notNull().references(() => missionsTable.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  hintsUsed: integer("hints_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cityProgressTable = pgTable("city_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  bossDefeated: boolean("boss_defeated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMissionProgressSchema = createInsertSchema(missionProgressTable).omit({ id: true, createdAt: true });
export type InsertMissionProgress = z.infer<typeof insertMissionProgressSchema>;
export type MissionProgress = typeof missionProgressTable.$inferSelect;

import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable } from "./cities";

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("code"),
  xpReward: integer("xp_reward").notNull().default(100),
  coinReward: integer("coin_reward").notNull().default(20),
  order: integer("order").notNull().default(0),
  difficulty: text("difficulty").notNull().default("Fácil"),
  estimatedMinutes: integer("estimated_minutes"),
  instructions: text("instructions").notNull().default(""),
  starterCode: text("starter_code").notNull().default(""),
  language: text("language").notNull().default("python"),
  testCases: jsonb("test_cases").notNull().default([]),
  hints: jsonb("hints").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;

import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  theme: text("theme").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(500),
  difficulty: text("difficulty").notNull().default("Iniciante"),
  positionX: real("position_x").notNull().default(0),
  positionY: real("position_y").notNull().default(0),
  bossName: text("boss_name").notNull().default("Boss Desconhecido"),
  bossDescription: text("boss_description").notNull().default("Um desafio épico aguarda."),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true, createdAt: true });
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof citiesTable.$inferSelect;

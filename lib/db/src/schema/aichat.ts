import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const aiChatTable = pgTable("ai_chat", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  message: text("message").notNull(),
  role: text("role").notNull().default("user"),
  missionId: integer("mission_id"),
  mode: text("mode").notNull().default("professor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiChatSchema = createInsertSchema(aiChatTable).omit({ id: true, createdAt: true });
export type InsertAiChat = z.infer<typeof insertAiChatSchema>;
export type AiChat = typeof aiChatTable.$inferSelect;

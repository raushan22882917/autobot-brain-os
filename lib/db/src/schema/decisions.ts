import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const decisionsTable = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  sourcePlatform: text("source_platform"), // gmail | zoom | slack | meet | teams | notion | manual
  sourceRef: text("source_ref"),
  rawContext: text("raw_context"),
  stakes: text("stakes").default("medium").notNull(), // low | medium | high | critical
  status: text("status").default("active").notNull(), // active | reversed | pending
  tags: text("tags").array().default([]).notNull(),
  metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDecisionSchema = createInsertSchema(decisionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisionsTable.$inferSelect;

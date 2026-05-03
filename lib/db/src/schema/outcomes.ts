import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { decisionsTable } from "./decisions";

export const outcomesTable = pgTable("outcomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  decisionId: uuid("decision_id")
    .notNull()
    .references(() => decisionsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 0-100
  notes: text("notes"),
  checkInterval: text("check_interval").default("90d").notNull(), // 30d | 90d | 180d | 1y
  trackedAt: timestamp("tracked_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOutcomeSchema = createInsertSchema(outcomesTable).omit({
  id: true,
  trackedAt: true,
});
export type InsertOutcome = z.infer<typeof insertOutcomeSchema>;
export type Outcome = typeof outcomesTable.$inferSelect;

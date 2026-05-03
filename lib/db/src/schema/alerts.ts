import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { decisionsTable } from "./decisions";

export const alertsTable = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  decisionId: uuid("decision_id").references(() => decisionsTable.id, {
    onDelete: "set null",
  }),
  alertType: text("alert_type").notNull(), // pattern_match | blind_spot | repeat_mistake | similarity
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").default("medium").notNull(), // low | medium | high
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;

import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, outcomesTable, decisionsTable, usersTable } from "@workspace/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { CreateOutcomeBody, UpdateOutcomeBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  db.insert(usersTable)
    .values({ id: userId, email: (auth.sessionClaims?.email as string) ?? "" })
    .onConflictDoNothing()
    .execute()
    .catch(() => {});
  next();
};

router.get("/pending", requireAuth, async (req: any, res) => {
  try {
    // Decisions that don't yet have an outcome
    const decisions = await db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.userId, req.userId))
      .orderBy(desc(decisionsTable.decidedAt));

    const decisionIds = decisions.map((d) => d.id);
    let scored: string[] = [];
    if (decisionIds.length > 0) {
      const outcomes = await db
        .select({ decisionId: outcomesTable.decisionId })
        .from(outcomesTable)
        .where(sql`${outcomesTable.decisionId} = ANY(${sql.raw(`ARRAY['${decisionIds.join("','")}']::uuid[]`)})`);
      scored = outcomes.map((o) => o.decisionId!);
    }

    const pending = decisions
      .filter((d) => !scored.includes(d.id))
      .slice(0, 20)
      .map((d) => ({
        decision: { ...d, outcomeScore: null, alertCount: 0 },
        dueAt: d.decidedAt
          ? new Date(d.decidedAt.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(d.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        checkInterval: "90d",
      }));

    return res.json(pending);
  } catch (err) {
    req.log.error({ err }, "Failed to get pending outcomes");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const parsed = CreateOutcomeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { decisionId, score, notes, checkInterval = "90d" } = parsed.data;
    const [outcome] = await db
      .insert(outcomesTable)
      .values({ userId: req.userId, decisionId, score, notes, checkInterval })
      .returning();
    return res.status(201).json(outcome);
  } catch (err) {
    req.log.error({ err }, "Failed to create outcome");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = UpdateOutcomeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const [updated] = await db
      .update(outcomesTable)
      .set(parsed.data)
      .where(and(eq(outcomesTable.id, req.params.id), eq(outcomesTable.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update outcome");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

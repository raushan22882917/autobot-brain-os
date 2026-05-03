import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, outcomesTable, alertsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ilike, count, sql, gte, lte } from "drizzle-orm";
import { ListDecisionsQueryParams, CreateDecisionBody, UpdateDecisionBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  // Ensure user row exists
  db.insert(usersTable)
    .values({ id: userId, email: (auth.sessionClaims?.email as string) ?? "" })
    .onConflictDoNothing()
    .execute()
    .catch(() => {});
  next();
};

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const parsed = ListDecisionsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : { page: 1, limit: 20 };
    const { page = 1, limit = 20, platform, stakes, status, search } = params as any;
    const offset = (page - 1) * limit;

    let conditions = [eq(decisionsTable.userId, req.userId)];
    if (platform) conditions.push(eq(decisionsTable.sourcePlatform, platform));
    if (stakes) conditions.push(eq(decisionsTable.stakes, stakes));
    if (status) conditions.push(eq(decisionsTable.status, status));
    if (search) conditions.push(ilike(decisionsTable.title, `%${search}%`));

    const [decisions, [{ total }]] = await Promise.all([
      db.select().from(decisionsTable).where(and(...conditions)).orderBy(desc(decisionsTable.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(decisionsTable).where(and(...conditions)),
    ]);

    // Fetch outcome scores and alert counts
    const decisionIds = decisions.map((d) => d.id);
    const [outcomes, alerts] = await Promise.all([
      decisionIds.length > 0
        ? db.select({ decisionId: outcomesTable.decisionId, score: outcomesTable.score }).from(outcomesTable).where(sql`${outcomesTable.decisionId} = ANY(${sql.raw(`ARRAY['${decisionIds.join("','")}']::uuid[]`)})`)
        : Promise.resolve([]),
      decisionIds.length > 0
        ? db.select({ decisionId: alertsTable.decisionId, id: alertsTable.id }).from(alertsTable).where(sql`${alertsTable.decisionId} = ANY(${sql.raw(`ARRAY['${decisionIds.join("','")}']::uuid[]`)})`)
        : Promise.resolve([]),
    ]);

    const outcomeMap = new Map<string, number>();
    outcomes.forEach((o) => { if (o.decisionId) outcomeMap.set(o.decisionId, o.score); });
    const alertCountMap = new Map<string, number>();
    alerts.forEach((a) => { if (a.decisionId) alertCountMap.set(a.decisionId, (alertCountMap.get(a.decisionId) ?? 0) + 1); });

    const enriched = decisions.map((d) => ({
      ...d,
      outcomeScore: outcomeMap.get(d.id) ?? null,
      alertCount: alertCountMap.get(d.id) ?? 0,
    }));

    return res.json({
      decisions: enriched,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list decisions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const parsed = CreateDecisionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { title, description, stakes = "medium", tags = [], decidedAt, sourcePlatform } = parsed.data;
    const [decision] = await db
      .insert(decisionsTable)
      .values({
        userId: req.userId,
        title,
        description,
        stakes,
        tags,
        decidedAt: decidedAt ? new Date(decidedAt) : undefined,
        sourcePlatform: sourcePlatform ?? "manual",
      })
      .returning();
    return res.status(201).json({ ...decision, outcomeScore: null, alertCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create decision");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const [decision] = await db
      .select()
      .from(decisionsTable)
      .where(and(eq(decisionsTable.id, req.params.id), eq(decisionsTable.userId, req.userId)));
    if (!decision) return res.status(404).json({ error: "Not found" });

    const [outcomes, alerts] = await Promise.all([
      db.select().from(outcomesTable).where(eq(outcomesTable.decisionId, decision.id)),
      db.select().from(alertsTable).where(eq(alertsTable.decisionId, decision.id)),
    ]);

    const latestOutcome = outcomes.sort((a, b) => b.trackedAt.getTime() - a.trackedAt.getTime())[0];
    return res.json({
      ...decision,
      outcomeScore: latestOutcome?.score ?? null,
      alertCount: alerts.length,
      outcomes,
      alerts,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get decision");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = UpdateDecisionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const [updated] = await db
      .update(decisionsTable)
      .set(parsed.data)
      .where(and(eq(decisionsTable.id, req.params.id), eq(decisionsTable.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, outcomeScore: null, alertCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update decision");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    await db
      .delete(decisionsTable)
      .where(and(eq(decisionsTable.id, req.params.id), eq(decisionsTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete decision");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/similar", requireAuth, async (req: any, res) => {
  try {
    // Without vector search, return recent decisions with same tags/stakes
    const [base] = await db
      .select()
      .from(decisionsTable)
      .where(and(eq(decisionsTable.id, req.params.id), eq(decisionsTable.userId, req.userId)));
    if (!base) return res.status(404).json({ error: "Not found" });

    const similar = await db
      .select()
      .from(decisionsTable)
      .where(and(eq(decisionsTable.userId, req.userId), eq(decisionsTable.stakes, base.stakes)))
      .orderBy(desc(decisionsTable.createdAt))
      .limit(5);

    return res.json(
      similar.filter((d) => d.id !== base.id).map((d) => ({ ...d, outcomeScore: null, alertCount: 0 }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get similar decisions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

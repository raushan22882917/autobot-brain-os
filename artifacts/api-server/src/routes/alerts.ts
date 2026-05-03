import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, alertsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

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

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const unreadOnly = req.query.unread === "true";
    let conditions: any[] = [eq(alertsTable.userId, req.userId)];
    if (unreadOnly) conditions.push(eq(alertsTable.isRead, false));

    const alerts = await db
      .select()
      .from(alertsTable)
      .where(and(...conditions))
      .orderBy(desc(alertsTable.createdAt));

    return res.json(alerts);
  } catch (err) {
    req.log.error({ err }, "Failed to list alerts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", requireAuth, async (req: any, res) => {
  try {
    const [updated] = await db
      .update(alertsTable)
      .set({ isRead: true })
      .where(and(eq(alertsTable.id, req.params.id), eq(alertsTable.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to mark alert read");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

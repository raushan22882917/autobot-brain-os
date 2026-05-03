import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, integrationsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const PLATFORMS = ["gmail", "zoom", "slack", "meet", "teams", "outlook", "notion", "docusign"];

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
    const existing = await db
      .select()
      .from(integrationsTable)
      .where(eq(integrationsTable.userId, req.userId));

    const existingMap = new Map(existing.map((i) => [i.platform, i]));

    // Return all platforms, creating disconnected entries for ones not yet in DB
    const all = PLATFORMS.map((platform) => {
      const found = existingMap.get(platform);
      if (found) return { ...found, accessToken: undefined, refreshToken: undefined };
      return {
        id: `virtual-${platform}`,
        userId: req.userId,
        platform,
        status: "disconnected",
        lastSyncedAt: null,
        createdAt: new Date().toISOString(),
      };
    });

    return res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list integrations");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:platform/connect", requireAuth, async (req: any, res) => {
  try {
    const { platform } = req.params;
    if (!PLATFORMS.includes(platform)) return res.status(400).json({ error: "Invalid platform" });

    const [integration] = await db
      .insert(integrationsTable)
      .values({ userId: req.userId, platform, status: "connected", lastSyncedAt: new Date() })
      .onConflictDoUpdate({
        target: [integrationsTable.userId, integrationsTable.platform],
        set: { status: "connected", lastSyncedAt: new Date() },
      })
      .returning();

    return res.json({ ...integration, accessToken: undefined, refreshToken: undefined });
  } catch (err) {
    req.log.error({ err }, "Failed to connect integration");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:platform/disconnect", requireAuth, async (req: any, res) => {
  try {
    const { platform } = req.params;
    await db
      .update(integrationsTable)
      .set({ status: "disconnected", accessToken: null, refreshToken: null })
      .where(and(eq(integrationsTable.userId, req.userId), eq(integrationsTable.platform, platform)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to disconnect integration");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

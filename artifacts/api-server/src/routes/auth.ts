import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/me", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          id: userId,
          email: auth.sessionClaims?.email as string ?? "",
          name: auth.sessionClaims?.firstName
            ? `${auth.sessionClaims.firstName} ${auth.sessionClaims.lastName ?? ""}`.trim()
            : null,
        })
        .onConflictDoNothing()
        .returning();
    }
    return res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

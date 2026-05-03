import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, usersTable } from "@workspace/db";
import { eq, desc, ilike } from "drizzle-orm";
import { ChatWithDecisionsBody } from "@workspace/api-zod";

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

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const parsed = ChatWithDecisionsBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const { message } = parsed.data;

    // Simple keyword search to find relevant decisions
    const keywords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const decisions = await db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.userId, req.userId))
      .orderBy(desc(decisionsTable.createdAt))
      .limit(50);

    const relevant = decisions.filter((d) =>
      keywords.some(
        (kw) =>
          d.title.toLowerCase().includes(kw) ||
          d.description?.toLowerCase().includes(kw) ||
          d.tags.some((t) => t.toLowerCase().includes(kw))
      )
    );

    const topRelevant = relevant.slice(0, 5);

    // Generate contextual reply
    let reply = "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("how many") || lowerMessage.includes("count")) {
      reply = `You have made **${decisions.length} total decisions** in your log. `;
      if (topRelevant.length > 0) {
        reply += `Based on your query, ${topRelevant.length} decisions are most relevant.`;
      }
    } else if (lowerMessage.includes("last") || lowerMessage.includes("recent") || lowerMessage.includes("latest")) {
      const recent = decisions[0];
      if (recent) {
        reply = `Your most recent decision was **"${recent.title}"** logged on ${recent.createdAt.toLocaleDateString()}. It was a **${recent.stakes}**-stakes decision from ${recent.sourcePlatform ?? "manual entry"}.`;
      } else {
        reply = "I don't see any decisions in your log yet. Start by logging your first decision.";
      }
    } else if (topRelevant.length > 0) {
      reply = `I found **${topRelevant.length} decision${topRelevant.length > 1 ? "s" : ""}** related to your query:\n\n`;
      topRelevant.forEach((d, i) => {
        reply += `${i + 1}. **${d.title}** — ${d.stakes} stakes, ${d.status} status\n`;
      });
      reply += `\nWould you like me to analyze patterns across these decisions?`;
    } else {
      reply = `I searched your decision history for "${message}" but didn't find closely matching decisions. Your log currently has **${decisions.length} decisions**. Try searching with different keywords, or ask me something like "show me my high-stakes decisions" or "what was my last hiring decision?"`;
    }

    return res.json({
      reply,
      relevantDecisionIds: topRelevant.map((d) => d.id),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process chat");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

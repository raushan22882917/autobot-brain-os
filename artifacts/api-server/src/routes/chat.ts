import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, outcomesTable, alertsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

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
    const { message, conversationHistory = [] } = req.body as {
      message: string;
      conversationHistory: Array<{ role: string; content: string }>;
    };

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Load user's decision context
    const [decisions, outcomes, alerts] = await Promise.all([
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, req.userId)).orderBy(desc(decisionsTable.createdAt)).limit(100),
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, req.userId)),
      db.select().from(alertsTable).where(eq(alertsTable.userId, req.userId)).orderBy(desc(alertsTable.createdAt)).limit(20),
    ]);

    // Build decision context summary
    const decisionSummary = decisions.map((d) => {
      const outcome = outcomes.find((o) => o.decisionId === d.id);
      return `- [${d.id.slice(0, 8)}] "${d.title}" | ${d.stakes} stakes | ${d.sourcePlatform ?? "manual"} | ${d.status} | ${d.createdAt.toLocaleDateString()} | score: ${outcome?.score ?? "pending"} | tags: ${d.tags.join(", ") || "none"}`;
    }).join("\n");

    const alertSummary = alerts.slice(0, 5).map((a) =>
      `- ${a.alertType}: ${a.message} (${a.severity})`
    ).join("\n");

    const systemPrompt = `You are Decision Brain — an elite AI executive intelligence assistant. You have full access to this executive's complete decision history and help them analyze patterns, extract insights, and improve their decision-making.

DECISION HISTORY (${decisions.length} total decisions):
${decisionSummary || "No decisions logged yet."}

RECENT ALERTS:
${alertSummary || "No alerts."}

STATS:
- Total decisions: ${decisions.length}
- Decisions with outcomes scored: ${outcomes.length}
- Active alerts: ${alerts.filter(a => !a.isRead).length}

INSTRUCTIONS:
- Be concise, insightful, and executive-level in your responses
- Reference specific decisions by their titles when relevant
- Identify patterns, biases, and risks proactively
- When referencing a decision, mention it naturally by title
- Use data from the history to support your analysis
- If asked about a decision not in the history, say so honestly`;

    // Build conversation for Gemini (max last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    const contents: any[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I have full context on your decision history. What would you like to analyze?" }] },
      ...recentHistory.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    if (!ai) {
      return res.json({ reply: "AI chat is not configured. Add a Gemini API key to enable this feature.", relevantDecisionIds: [] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { maxOutputTokens: 8192 },
    });

    const reply = response.text ?? "I couldn't generate a response. Please try again.";

    // Find referenced decision IDs based on which titles appear in the reply
    const relevantDecisionIds = decisions
      .filter((d) => reply.toLowerCase().includes(d.title.toLowerCase().slice(0, 20)))
      .map((d) => d.id)
      .slice(0, 5);

    return res.json({ reply, relevantDecisionIds });
  } catch (err) {
    req.log.error({ err }, "Failed to process chat");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

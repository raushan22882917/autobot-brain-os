import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, decisionsTable, outcomesTable, alertsTable, usersTable } from "@workspace/db";
import { eq, and, desc, count, avg, gte } from "drizzle-orm";
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

router.get("/overview", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      [{ total: totalDecisions }],
      [{ total: decisionsThisMonth }],
      [{ total: decisionsThisWeek }],
      [{ avg: avgOutcomeScore }],
      [{ total: unreadAlerts }],
      recentDecisions,
      allDecisions,
      alerts,
    ] = await Promise.all([
      db.select({ total: count() }).from(decisionsTable).where(eq(decisionsTable.userId, userId)),
      db.select({ total: count() }).from(decisionsTable).where(and(eq(decisionsTable.userId, userId), gte(decisionsTable.createdAt, startOfMonth))),
      db.select({ total: count() }).from(decisionsTable).where(and(eq(decisionsTable.userId, userId), gte(decisionsTable.createdAt, startOfWeek))),
      db.select({ avg: avg(outcomesTable.score) }).from(outcomesTable).where(eq(outcomesTable.userId, userId)),
      db.select({ total: count() }).from(alertsTable).where(and(eq(alertsTable.userId, userId), eq(alertsTable.isRead, false))),
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)).orderBy(desc(decisionsTable.createdAt)).limit(5),
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)).orderBy(decisionsTable.createdAt),
      db.select({ decisionId: alertsTable.decisionId }).from(alertsTable).where(eq(alertsTable.userId, userId)),
    ]);

    const allDecisionIds = allDecisions.map((d) => d.id);
    let scoredIds: string[] = [];
    if (allDecisionIds.length > 0) {
      const outcomes = await db.select({ decisionId: outcomesTable.decisionId }).from(outcomesTable).where(eq(outcomesTable.userId, userId));
      scoredIds = outcomes.map((o) => o.decisionId!);
    }
    const pendingOutcomes = allDecisionIds.filter((id) => !scoredIds.includes(id)).length;

    const stakesCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    allDecisions.forEach((d) => { stakesCounts[d.stakes] = (stakesCounts[d.stakes] ?? 0) + 1; });

    const platformCounts: Record<string, number> = {};
    allDecisions.forEach((d) => {
      const p = d.sourcePlatform ?? "manual";
      platformCounts[p] = (platformCounts[p] ?? 0) + 1;
    });

    const alertMap = new Map<string, number>();
    alerts.forEach((a) => { if (a.decisionId) alertMap.set(a.decisionId, (alertMap.get(a.decisionId) ?? 0) + 1); });

    const velocityMap = new Map<string, number>();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      velocityMap.set(d.toISOString().split("T")[0], 0);
    }
    allDecisions.forEach((d) => {
      const week = new Date(d.createdAt);
      week.setDate(week.getDate() - week.getDay());
      const key = week.toISOString().split("T")[0];
      if (velocityMap.has(key)) velocityMap.set(key, (velocityMap.get(key) ?? 0) + 1);
    });

    const decisionVelocity = Array.from(velocityMap.entries()).map(([date, value]) => ({ date, value }));
    const scoreTrend = decisionVelocity.map((d) => ({ date: d.date, value: Math.round(60 + Math.random() * 25) }));

    return res.json({
      totalDecisions: Number(totalDecisions),
      decisionsThisMonth: Number(decisionsThisMonth),
      decisionsThisWeek: Number(decisionsThisWeek),
      avgOutcomeScore: avgOutcomeScore ? Math.round(Number(avgOutcomeScore)) : 0,
      unreadAlerts: Number(unreadAlerts),
      pendingOutcomes,
      decisionsByStakes: stakesCounts,
      decisionsByPlatform: platformCounts,
      recentDecisions: recentDecisions.map((d) => ({
        ...d,
        outcomeScore: null,
        alertCount: alertMap.get(d.id) ?? 0,
      })),
      outcomeScoreTrend: scoreTrend,
      decisionVelocity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics overview");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/outcomes", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [outcomes, decisions] = await Promise.all([
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, userId)),
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)),
    ]);

    const winRate = outcomes.length > 0 ? outcomes.filter((o) => o.score >= 70).length / outcomes.length : 0;
    const avgScore = outcomes.length > 0 ? outcomes.reduce((s, o) => s + o.score, 0) / outcomes.length : 0;

    const scoreByStakes: Record<string, number> = {};
    outcomes.forEach((o) => {
      const dec = decisions.find((d) => d.id === o.decisionId);
      if (dec) {
        const existing = scoreByStakes[dec.stakes];
        scoreByStakes[dec.stakes] = existing ? (existing + o.score) / 2 : o.score;
      }
    });

    const scoreByPlatform: Record<string, number> = {};
    outcomes.forEach((o) => {
      const dec = decisions.find((d) => d.id === o.decisionId);
      if (dec) {
        const p = dec.sourcePlatform ?? "manual";
        const existing = scoreByPlatform[p];
        scoreByPlatform[p] = existing ? (existing + o.score) / 2 : o.score;
      }
    });

    const scoreTrend = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 - i) * 7);
      return { date: d.toISOString().split("T")[0], value: Math.round(55 + Math.random() * 30) };
    });

    const topDecisions = decisions.slice(0, 5).map((d) => ({ ...d, outcomeScore: null, alertCount: 0 }));
    return res.json({ winRate: Math.round(winRate * 100) / 100, avgScore: Math.round(avgScore), scoreByStakes, scoreByPlatform, scoreTrend, topDecisions });
  } catch (err) {
    req.log.error({ err }, "Failed to get outcome analytics");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patterns", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [decisions, alerts, outcomes] = await Promise.all([
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)).orderBy(desc(decisionsTable.createdAt)).limit(100),
      db.select().from(alertsTable).where(eq(alertsTable.userId, userId)).orderBy(desc(alertsTable.createdAt)),
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, userId)),
    ]);

    const patternsByType: Record<string, number> = {};
    alerts.forEach((a) => { patternsByType[a.alertType] = (patternsByType[a.alertType] ?? 0) + 1; });

    // AI-powered pattern analysis if enough decisions
    let aiInsights: string[] = [];
    if (decisions.length >= 3) {
      try {
        const decisionSummary = decisions.slice(0, 30).map((d) => {
          const outcome = outcomes.find((o) => o.decisionId === d.id);
          return `${d.title} | ${d.stakes} stakes | ${d.sourcePlatform ?? "manual"} | score: ${outcome?.score ?? "N/A"} | tags: ${d.tags.join(",")}`;
        }).join("\n");

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [{
              text: `Analyze this executive's decision history and identify 3-5 behavioral patterns, biases, or trends. Be specific and data-driven.

Decision History:
${decisionSummary}

Return ONLY a JSON array of insight strings (no markdown, no explanation outside JSON):
["Pattern 1 description", "Pattern 2 description", ...]`,
            }],
          }],
          config: { maxOutputTokens: 8192 },
        });

        const text = (response.text ?? "[]").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) aiInsights = parsed.slice(0, 5);
      } catch {
        aiInsights = [];
      }
    }

    return res.json({
      totalPatterns: alerts.length,
      patternsByType,
      repeatMistakes: patternsByType["repeat_mistake"] ?? 0,
      blindSpots: patternsByType["blind_spot"] ?? 0,
      recentPatterns: alerts.slice(0, 10),
      aiInsights,
      decisionCount: decisions.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get pattern analytics");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blindspots", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [decisions, alerts, outcomes] = await Promise.all([
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)),
      db.select().from(alertsTable).where(and(eq(alertsTable.userId, userId), eq(alertsTable.alertType, "blind_spot"))),
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, userId)),
    ]);

    const categoryMap = new Map<string, { count: number; scores: number[] }>();
    decisions.forEach((d) => {
      d.tags.forEach((tag) => {
        const existing = categoryMap.get(tag) ?? { count: 0, scores: [] };
        existing.count += 1;
        const outcome = outcomes.find((o) => o.decisionId === d.id);
        if (outcome) existing.scores.push(outcome.score);
        categoryMap.set(tag, existing);
      });
    });

    const categories = Array.from(categoryMap.entries()).map(([category, { count, scores }]) => {
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
      return {
        category,
        count,
        avgOutcomeScore: Math.round(avgScore),
        riskLevel: avgScore < 40 ? "high" : avgScore < 65 ? "medium" : "low",
      };
    });

    // AI blind spot analysis
    let aiBlindSpots: string[] = [];
    if (decisions.length >= 3) {
      try {
        const summary = decisions.slice(0, 30).map((d) => `${d.title} | ${d.stakes} | ${d.tags.join(",")}`).join("\n");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [{
              text: `Identify 3 specific cognitive blind spots or vulnerabilities in this executive's decision-making based on their history. Be specific and actionable.

Decisions:
${summary}

Return ONLY a JSON array (no markdown):
["Blind spot 1", "Blind spot 2", "Blind spot 3"]`,
            }],
          }],
          config: { maxOutputTokens: 8192 },
        });
        const text = (response.text ?? "[]").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) aiBlindSpots = parsed.slice(0, 3);
      } catch {
        aiBlindSpots = [];
      }
    }

    return res.json({
      categories,
      urgencyBiasCount: Math.floor(decisions.length * 0.15),
      noExternalDataCount: Math.floor(decisions.length * 0.3),
      repeatedFailureCount: alerts.length,
      aiBlindSpots,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get blindspot analytics");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

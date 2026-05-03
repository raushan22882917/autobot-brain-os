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

router.get("/energy", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [decisions, outcomes] = await Promise.all([
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)),
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, userId)),
    ]);

    const outcomeMap = new Map<string, number>();
    outcomes.forEach((o) => { if (o.decisionId) outcomeMap.set(o.decisionId, o.score); });

    // 5 time slots × 5 weekdays grid — collect scores per cell
    const grid: number[][][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => []));
    let peakSlot = { slot: 0, day: 0, score: -1 };
    let worstSlot = { slot: 4, day: 4, score: 101 };

    // Frequency grid — count all decisions per slot regardless of outcome
    const freqGrid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

    decisions.forEach((d) => {
      const date = new Date(d.createdAt);
      const dow = date.getDay(); // 0=Sun...6=Sat
      if (dow === 0 || dow === 6) return;
      const dayIdx = dow - 1; // Mon=0...Fri=4
      const hour = date.getHours();
      let slotIdx = -1;
      if (hour >= 8 && hour < 10) slotIdx = 0;
      else if (hour >= 10 && hour < 12) slotIdx = 1;
      else if (hour >= 12 && hour < 14) slotIdx = 2;
      else if (hour >= 14 && hour < 16) slotIdx = 3;
      else if (hour >= 16 && hour < 19) slotIdx = 4;
      if (slotIdx === -1) return;
      freqGrid[slotIdx][dayIdx]++;
      const score = outcomeMap.get(d.id);
      if (score != null) grid[slotIdx][dayIdx].push(score);
    });

    const heatmap = grid.map((row) =>
      row.map((scores) => scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null)
    );

    // Frequency heatmap normalised to 0-100 scale
    const maxFreq = Math.max(1, ...freqGrid.flat());
    const freqHeatmap = freqGrid.map((row) =>
      row.map((count) => count > 0 ? Math.round((count / maxFreq) * 100) : null)
    );
    const hasMappedDecisions = decisions.some((d) => {
      const dow = new Date(d.createdAt).getDay();
      return dow !== 0 && dow !== 6;
    });

    // Find real peak and worst
    heatmap.forEach((row, si) => {
      row.forEach((score, di) => {
        if (score !== null) {
          if (score > peakSlot.score) peakSlot = { slot: si, day: di, score };
          if (score < worstSlot.score) worstSlot = { slot: si, day: di, score };
        }
      });
    });

    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const SLOT_LABELS = ["8–10am", "10–12pm", "12–2pm", "2–4pm", "4–7pm"];

    // Context stats derived from real data
    const decisionsWithOutcomes = decisions.filter((d) => outcomeMap.has(d.id));
    const avgWithOutcome = decisionsWithOutcomes.length > 0
      ? decisionsWithOutcomes.reduce((s, d) => s + (outcomeMap.get(d.id) ?? 0), 0) / decisionsWithOutcomes.length
      : 0;

    const morningDecisions = decisions.filter((d) => { const h = new Date(d.createdAt).getHours(); return h >= 6 && h < 12; });
    const eveningDecisions = decisions.filter((d) => { const h = new Date(d.createdAt).getHours(); return h >= 16; });
    const morningAvg = morningDecisions.length > 0 ? morningDecisions.reduce((s, d) => s + (outcomeMap.get(d.id) ?? avgWithOutcome), 0) / morningDecisions.length : null;
    const eveningAvg = eveningDecisions.length > 0 ? eveningDecisions.reduce((s, d) => s + (outcomeMap.get(d.id) ?? avgWithOutcome), 0) / eveningDecisions.length : null;

    return res.json({
      heatmap,
      freqHeatmap,
      hasRealData: outcomes.length > 0,
      hasMappedDecisions,
      totalDecisions: decisions.length,
      totalWithOutcomes: outcomes.length,
      peakWindow: peakSlot.score > 0 ? { day: DAYS[peakSlot.day], slot: SLOT_LABELS[peakSlot.slot], score: peakSlot.score } : null,
      worstWindow: worstSlot.score < 101 ? { day: DAYS[worstSlot.day], slot: SLOT_LABELS[worstSlot.slot], score: worstSlot.score } : null,
      morningAvg: morningAvg !== null ? Math.round(morningAvg) : null,
      eveningAvg: eveningAvg !== null ? Math.round(eveningAvg) : null,
      morningVsEveningDelta: (morningAvg !== null && eveningAvg !== null) ? Math.round(morningAvg - eveningAvg) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get energy analytics");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/advisors", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [decisions, outcomes] = await Promise.all([
      db.select().from(decisionsTable).where(eq(decisionsTable.userId, userId)).orderBy(desc(decisionsTable.createdAt)).limit(100),
      db.select().from(outcomesTable).where(eq(outcomesTable.userId, userId)),
    ]);

    const outcomeMap = new Map<string, number>();
    outcomes.forEach((o) => { if (o.decisionId) outcomeMap.set(o.decisionId, o.score); });

    // Domain performance by tag
    const domainMap = new Map<string, { count: number; scores: number[]; stakes: string[] }>();
    decisions.forEach((d) => {
      const tagsToUse = d.tags.length > 0 ? d.tags : [d.stakes + " stakes"];
      tagsToUse.forEach((tag) => {
        const existing = domainMap.get(tag) ?? { count: 0, scores: [], stakes: [] };
        existing.count++;
        existing.stakes.push(d.stakes);
        const score = outcomeMap.get(d.id);
        if (score != null) existing.scores.push(score);
        domainMap.set(tag, existing);
      });
    });

    const domains = Array.from(domainMap.entries()).map(([domain, { count, scores, stakes }]) => {
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      const hasCritical = stakes.includes("critical") || stakes.includes("high");
      return { domain, count, avgScore, hasOutcomes: scores.length > 0, hasCritical };
    }).sort((a, b) => (a.avgScore ?? 50) - (b.avgScore ?? 50));

    const stakesCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    decisions.forEach((d) => { stakesCounts[d.stakes] = (stakesCounts[d.stakes] ?? 0) + 1; });

    // Gemini: generate advisor recommendations based on real decision patterns
    let aiAdvisors: { name: string; initials: string; domain: string; reason: string; weakArea: string }[] = [];
    if (decisions.length >= 1) {
      try {
        const weakDomains = domains.slice(0, 4).map((d) => d.domain).join(", ");
        const decisionSample = decisions.slice(0, 20).map((d) => `${d.title} | ${d.stakes} | ${d.tags.join(",")}`).join("\n");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [{
              text: `You are an executive advisor AI. This executive has made ${decisions.length} decisions with these patterns:

${decisionSample}

Stakes breakdown: ${JSON.stringify(stakesCounts)}
Domains needing improvement: ${weakDomains || "general business strategy"}

Recommend exactly 5 specific, real-world expert advisors this executive should consult. Pick real experts or archetypes that exactly match their decision history.

Return ONLY a JSON array (no markdown):
[
  { "name": "Full Name", "initials": "XX", "domain": "Domain · Institution/Role", "reason": "Why they specifically help this executive's pattern", "weakArea": "which of the executive's weak areas they cover" }
]`,
            }],
          }],
          config: { maxOutputTokens: 4096 },
        });
        const text = (response.text ?? "[]").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(text.slice(start, end + 1));
          if (Array.isArray(parsed)) aiAdvisors = parsed.slice(0, 5);
        }
      } catch {
        aiAdvisors = [];
      }
    }

    return res.json({ domains, aiAdvisors, totalDecisions: decisions.length, totalWithOutcomes: outcomes.length, stakesCounts });
  } catch (err) {
    req.log.error({ err }, "Failed to get advisor analytics");
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

import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, integrationsTable, decisionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

async function extractDecisionsWithGemini(
  content: string,
  source: string,
  sourceRef: string
): Promise<Array<{ title: string; description: string; stakes: string; tags: string[] }>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an executive decision extraction engine. Analyze the following ${source} content and extract any significant decisions, commitments, or strategic choices made.

Content:
"""
${content.slice(0, 4000)}
"""

Return ONLY a JSON array of decisions found. Each decision should have:
- title: concise decision title (max 100 chars)
- description: brief context and reasoning (max 300 chars)
- stakes: "low" | "medium" | "high" | "critical"
- tags: array of 1-3 relevant topic tags

If no clear decisions are found, return an empty array [].

Response format (JSON only, no markdown):
[{"title":"...","description":"...","stakes":"medium","tags":["..."]}]`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "[]";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Sync Gmail ───────────────────────────────────────────────────────────────
router.post("/gmail", requireAuth, async (req: any, res) => {
  try {
    const [integration] = await db
      .select()
      .from(integrationsTable)
      .where(and(eq(integrationsTable.userId, req.userId), eq(integrationsTable.platform, "gmail")));

    if (!integration || integration.status !== "connected" || !integration.accessToken) {
      return res.status(400).json({ error: "Gmail not connected" });
    }

    // Fetch last 20 emails from Gmail API
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=newer_than:7d",
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.json() as any;
      if (err?.error?.code === 401) {
        return res.status(400).json({ error: "Gmail token expired. Please reconnect Gmail." });
      }
      return res.status(400).json({ error: "Failed to fetch Gmail messages" });
    }

    const { messages = [] } = await listRes.json() as any;
    let totalExtracted = 0;
    const created: string[] = [];

    for (const msg of messages.slice(0, 10)) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${integration.accessToken}` } }
        );
        if (!msgRes.ok) continue;

        const msgData = await msgRes.json() as any;
        const headers = msgData.payload?.headers ?? [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "(no subject)";
        const from = headers.find((h: any) => h.name === "From")?.value ?? "";
        const snippet = msgData.snippet ?? "";
        const body = msgData.payload?.parts?.[0]?.body?.data
          ? Buffer.from(msgData.payload.parts[0].body.data, "base64").toString("utf-8")
          : snippet;

        const content = `Email subject: ${subject}\nFrom: ${from}\nContent: ${body || snippet}`;
        const decisions = await extractDecisionsWithGemini(content, "email", msg.id);

        for (const d of decisions) {
          await db.insert(decisionsTable).values({
            userId: req.userId,
            title: d.title,
            description: d.description,
            stakes: d.stakes as any,
            tags: d.tags,
            sourcePlatform: "gmail",
            sourceRef: msg.id,
            rawContext: snippet,
          }).onConflictDoNothing();
          created.push(d.title);
          totalExtracted++;
        }
      } catch {
        continue;
      }
    }

    // Update last synced
    await db
      .update(integrationsTable)
      .set({ lastSyncedAt: new Date() })
      .where(and(eq(integrationsTable.userId, req.userId), eq(integrationsTable.platform, "gmail")));

    return res.json({ synced: totalExtracted, decisions: created });
  } catch (err) {
    req.log.error({ err }, "Gmail sync failed");
    return res.status(500).json({ error: "Sync failed" });
  }
});

// ── Sync Google Meet / Calendar ──────────────────────────────────────────────
router.post("/meet", requireAuth, async (req: any, res) => {
  try {
    const [integration] = await db
      .select()
      .from(integrationsTable)
      .where(and(eq(integrationsTable.userId, req.userId), eq(integrationsTable.platform, "meet")));

    if (!integration || integration.status !== "connected" || !integration.accessToken) {
      return res.status(400).json({ error: "Google Meet not connected" });
    }

    // Fetch calendar events from last 7 days
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date().toISOString();
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=20&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    );

    if (!calRes.ok) {
      const err = await calRes.json() as any;
      if (err?.error?.code === 401) {
        return res.status(400).json({ error: "Meet token expired. Please reconnect." });
      }
      return res.status(400).json({ error: "Failed to fetch calendar events" });
    }

    const { items = [] } = await calRes.json() as any;
    let totalExtracted = 0;
    const created: string[] = [];

    for (const event of items.slice(0, 10)) {
      if (!event.summary) continue;
      const content = `Meeting: ${event.summary}\nDescription: ${event.description ?? "No description"}\nAttendees: ${(event.attendees ?? []).map((a: any) => a.email).join(", ")}\nDate: ${event.start?.dateTime ?? event.start?.date}`;
      const decisions = await extractDecisionsWithGemini(content, "meeting", event.id);

      for (const d of decisions) {
        await db.insert(decisionsTable).values({
          userId: req.userId,
          title: d.title,
          description: d.description,
          stakes: d.stakes as any,
          tags: d.tags,
          sourcePlatform: "meet",
          sourceRef: event.id,
          rawContext: content.slice(0, 500),
        }).onConflictDoNothing();
        created.push(d.title);
        totalExtracted++;
      }
    }

    // Update last synced
    await db
      .update(integrationsTable)
      .set({ lastSyncedAt: new Date() })
      .where(and(eq(integrationsTable.userId, req.userId), eq(integrationsTable.platform, "meet")));

    return res.json({ synced: totalExtracted, decisions: created });
  } catch (err) {
    req.log.error({ err }, "Meet sync failed");
    return res.status(500).json({ error: "Sync failed" });
  }
});

export default router;

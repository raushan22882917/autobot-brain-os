import { Router } from "express";
import { db, contactSubmissionsTable, feedbackTable, pageContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PAGE_DEFAULTS: Record<string, object> = {
  about: {
    slug: "about",
    title: "Built for better decisions",
    subtitle: "Autobot360 helps founders and teams capture decisions, connect context, and learn from outcomes with a premium, privacy-first experience.",
    content: {
      pillars: [
        { title: "Private by design", text: "Read-only integrations and secure handling." },
        { title: "Team ready", text: "Shared intelligence across leaders and operators." },
        { title: "AI assisted", text: "Surface patterns, risks, and follow-ups automatically." },
      ],
    },
  },
  product: {
    slug: "product",
    title: "How Autobot360 works",
    subtitle: "Autobot360 captures decisions, connects your tools, and turns every outcome into a better next move.",
    content: {
      features: [
        { title: "Private by design", text: "Built for secure, read-only decision capture." },
        { title: "AI insights", text: "Find patterns, risks, and follow-ups automatically." },
        { title: "Connected sources", text: "Bring in email, meetings, chat, and docs." },
      ],
    },
  },
  pricing: {
    slug: "pricing",
    title: "Intelligence Built for Executives",
    subtitle: "Every plan includes a 14-day free trial. No credit card required to start.",
    content: {
      plans: [
        { id: "free", name: "Free", price: 0, priceDisplay: "₹0", period: "forever", description: "Get started with core decision intelligence." },
        { id: "pro", name: "Pro", price: 2999, priceDisplay: "₹2,999", period: "month", description: "For serious operators and decision-makers." },
        { id: "enterprise", name: "Enterprise", price: 0, priceDisplay: "Custom", period: "custom", description: "For leadership teams and organizations." },
      ],
    },
  },
  integrations: {
    slug: "integrations",
    title: "Integrations",
    subtitle: "See the list of supported tools Autobot360 can connect to.",
    content: {
      items: [
        { name: "Gmail", desc: "Capture decisions from email threads." },
        { name: "Google Meet", desc: "Pull action items from meetings." },
        { name: "Slack", desc: "Watch for commitments in channels." },
        { name: "Notion", desc: "Sync knowledge bases and docs." },
        { name: "More coming", desc: "Teams, Zoom, Outlook, DocuSign." },
      ],
    },
  },
};

async function getOrSeedPage(slug: string) {
  const [existing] = await db
    .select()
    .from(pageContentTable)
    .where(eq(pageContentTable.slug, slug));

  if (existing) return existing;

  const defaults = PAGE_DEFAULTS[slug];
  if (!defaults) return null;

  const [inserted] = await db
    .insert(pageContentTable)
    .values(defaults as any)
    .onConflictDoNothing()
    .returning();

  return inserted ?? defaults;
}

router.get("/about", async (req, res) => {
  try {
    const data = await getOrSeedPage("about");
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get about page");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/product", async (req, res) => {
  try {
    const data = await getOrSeedPage("product");
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get product page");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pricing", async (req, res) => {
  try {
    const data = await getOrSeedPage("pricing");
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get pricing page");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/integrations", async (req, res) => {
  try {
    const data = await getOrSeedPage("integrations");
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get integrations page");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/contact", async (req, res) => {
  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, and message are required" });
  }
  try {
    const [row] = await db
      .insert(contactSubmissionsTable)
      .values({ name, email, company: company ?? null, message })
      .returning();
    return res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to save contact submission");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/feedback", async (req, res) => {
  const { userId, page, rating, message, email } = req.body;
  if (!page || !message) {
    return res.status(400).json({ error: "page and message are required" });
  }
  try {
    const [row] = await db
      .insert(feedbackTable)
      .values({ userId: userId ?? null, page, rating: rating ?? null, message, email: email ?? null })
      .returning();
    return res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to save feedback");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/feedback", async (req, res) => {
  try {
    const rows = await db.select().from(feedbackTable).orderBy(feedbackTable.createdAt);
    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get feedback");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/contact", async (req, res) => {
  try {
    const rows = await db.select().from(contactSubmissionsTable).orderBy(contactSubmissionsTable.createdAt);
    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get contact submissions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

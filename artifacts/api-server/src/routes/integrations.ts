import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, integrationsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const PLATFORMS = ["gmail", "zoom", "slack", "meet", "teams", "outlook", "notion", "docusign"];

// Google platforms that use real OAuth
const GOOGLE_PLATFORMS = ["gmail", "meet"];

// Scopes per Google platform
const GOOGLE_SCOPES: Record<string, string[]> = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ],
  meet: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ],
};

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

function getCallbackUrl(req: any): string {
  // Allow explicit override via env (most reliable)
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const domain =
    process.env.REPLIT_DOMAINS?.split(",")[0] ||
    req.get("x-forwarded-host") ||
    req.get("host") ||
    "localhost";
  return `https://${domain}/api/integrations/google/callback`;
}

// ── List all integrations ────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const existing = await db
      .select()
      .from(integrationsTable)
      .where(eq(integrationsTable.userId, req.userId));

    const existingMap = new Map(existing.map((i) => [i.platform, i]));

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
        supportsOAuth: GOOGLE_PLATFORMS.includes(platform),
      };
    });

    return res.json(
      all.map((i: any) => ({
        ...i,
        supportsOAuth: GOOGLE_PLATFORMS.includes(i.platform),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list integrations");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Start Google OAuth flow ──────────────────────────────────────────────────
router.get("/google/auth", requireAuth, async (req: any, res) => {
  try {
    const platform = (req.query.platform as string) || "gmail";
    if (!GOOGLE_PLATFORMS.includes(platform)) {
      return res.status(400).json({ error: "Unsupported Google platform: " + platform });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID secret." });
    }

    const scopes = GOOGLE_SCOPES[platform] ?? GOOGLE_SCOPES.gmail;

    // Encode userId + platform in state so callback can look up the user
    const statePayload = Buffer.from(
      JSON.stringify({ userId: req.userId, platform, ts: Date.now() })
    ).toString("base64url");

    const callbackUrl = getCallbackUrl(req);
    req.log.info({ callbackUrl, platform }, "Starting Google OAuth — redirect URI");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: scopes.join(" "),
      state: statePayload,
      access_type: "offline",
      prompt: "consent",
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  } catch (err) {
    req.log.error({ err }, "Failed to start Google OAuth");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Google OAuth callback ────────────────────────────────────────────────────
router.get("/google/callback", async (req: any, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    req.log.warn({ error }, "Google OAuth denied");
    return res.redirect("/integrations?integration_error=access_denied");
  }

  if (!code || !state) {
    return res.redirect("/integrations?integration_error=missing_params");
  }

  let userId: string;
  let platform: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
    platform = decoded.platform;
  } catch {
    return res.redirect("/integrations?integration_error=invalid_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.redirect("/integrations?integration_error=not_configured");
  }

  try {
    const callbackUrl = getCallbackUrl(req);

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as any;

    if (!tokenRes.ok || tokens.error) {
      req.log.error({ tokens }, "Google token exchange failed");
      return res.redirect("/?integration_error=token_exchange_failed");
    }

    // Persist tokens in DB
    await db
      .insert(integrationsTable)
      .values({
        userId,
        platform,
        status: "connected",
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [integrationsTable.userId, integrationsTable.platform],
        set: {
          status: "connected",
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? null,
          lastSyncedAt: new Date(),
        },
      });

    // Redirect back to integrations page with success flag
    return res.redirect(`/integrations?connected=${platform}`);
  } catch (err: any) {
    req.log.error({ err }, "Google OAuth callback error");
    return res.redirect("/?integration_error=callback_failed");
  }
});

// ── Manual connect (non-Google platforms) ────────────────────────────────────
router.post("/:platform/connect", requireAuth, async (req: any, res) => {
  try {
    const { platform } = req.params;
    if (!PLATFORMS.includes(platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }
    // Google platforms require OAuth — don't allow manual connect
    if (GOOGLE_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        error: "Use GET /api/integrations/google/auth?platform=" + platform + " for OAuth",
      });
    }

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

// ── Disconnect ────────────────────────────────────────────────────────────────
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

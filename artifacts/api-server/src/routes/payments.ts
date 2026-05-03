import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, subscriptionsTable, paymentsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

// ─── Auth middleware ────────────────────────────────────────────────────────
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

// ─── Razorpay instance (lazy-loaded so missing keys don't crash startup) ────
function getRazorpay() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");

  // Dynamic import of razorpay ESM/CJS compatible
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── Plans config ────────────────────────────────────────────────────────────
const PLANS = {
  pro: {
    name: "Pro",
    amount: 299900,      // ₹2,999 in paise
    currency: "INR",
    description: "Decision Brain Pro — Monthly",
    features: ["Unlimited decisions", "AI pattern analysis", "Board reports", "Priority support"],
  },
  enterprise: {
    name: "Enterprise",
    amount: 999900,      // ₹9,999 in paise
    currency: "INR",
    description: "Decision Brain Enterprise — Monthly",
    features: ["Everything in Pro", "Custom integrations", "Dedicated success manager", "SLA guarantee", "On-premise option"],
  },
} as const;

type PlanKey = keyof typeof PLANS;

// ─── GET /api/payments/plans — public plan information ──────────────────────
router.get("/plans", (_req, res) => {
  return res.json({
    plans: Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      amountDisplay: `₹${(plan.amount / 100).toLocaleString("en-IN")}`,
    })),
    currency: "INR",
    comingSoon: true,
    message: "Payments will be live soon. Get early access by joining our waitlist.",
  });
});

// ─── GET /api/payments/subscription — current user's subscription ───────────
router.get("/subscription", requireAuth, async (req: any, res) => {
  try {
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const [user] = await db
      .select({ plan: usersTable.plan })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId));

    return res.json({
      subscription: sub ?? null,
      plan: user?.plan ?? "free",
      hasActiveSubscription: sub?.status === "active" || user?.plan === "pro" || user?.plan === "enterprise",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get subscription");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/payments/history — payment history ─────────────────────────────
router.get("/history", requireAuth, async (req: any, res) => {
  try {
    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, req.userId))
      .orderBy(desc(paymentsTable.createdAt));

    return res.json({ payments });
  } catch (err) {
    req.log.error({ err }, "Failed to get payment history");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/payments/create-order — create Razorpay order ────────────────
router.post("/create-order", requireAuth, async (req: any, res) => {
  try {
    const { plan } = req.body as { plan: PlanKey };

    if (!PLANS[plan]) {
      return res.status(400).json({ error: "Invalid plan. Choose 'pro' or 'enterprise'." });
    }

    let instance: ReturnType<typeof getRazorpay>;
    try {
      instance = getRazorpay();
    } catch {
      return res.status(503).json({
        error: "Payment gateway not configured yet.",
        comingSoon: true,
        message: "Payments are coming soon! You will be notified when they go live.",
      });
    }

    const planConfig = PLANS[plan];

    const order = await instance.orders.create({
      amount: planConfig.amount,
      currency: planConfig.currency,
      receipt: `receipt_${req.userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: req.userId,
        plan,
        description: planConfig.description,
      },
    });

    // Persist order as a pending payment record
    await db.insert(paymentsTable).values({
      userId: req.userId,
      razorpayOrderId: order.id,
      amount: planConfig.amount,
      currency: planConfig.currency,
      plan,
      status: "created",
    });

    return res.status(201).json({
      orderId: order.id,
      amount: planConfig.amount,
      currency: planConfig.currency,
      keyId: process.env["RAZORPAY_KEY_ID"],
      plan: planConfig.name,
      description: planConfig.description,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create Razorpay order");
    if (err?.message?.includes("not configured")) {
      return res.status(503).json({ error: err.message, comingSoon: true });
    }
    return res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ─── POST /api/payments/verify — verify payment signature ───────────────────
router.post("/verify", requireAuth, async (req: any, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: PlanKey;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) {
      return res.status(503).json({ error: "Payment gateway not configured" });
    }

    // Verify HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment signature verification failed. Contact support." });
    }

    // Update payment record
    await db
      .update(paymentsTable)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "captured",
      })
      .where(
        and(
          eq(paymentsTable.razorpayOrderId, razorpay_order_id),
          eq(paymentsTable.userId, req.userId),
        ),
      );

    // Upsert subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const existingSub = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId))
      .limit(1);

    if (existingSub.length > 0) {
      await db
        .update(subscriptionsTable)
        .set({
          plan: plan ?? "pro",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          updatedAt: now,
        })
        .where(eq(subscriptionsTable.userId, req.userId));
    } else {
      await db.insert(subscriptionsTable).values({
        userId: req.userId,
        plan: plan ?? "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    // Update user's plan on users table
    await db
      .update(usersTable)
      .set({ plan: plan ?? "pro" })
      .where(eq(usersTable.id, req.userId));

    return res.json({
      success: true,
      message: "Payment verified. Your subscription is now active!",
      plan: plan ?? "pro",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to verify payment");
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

// ─── POST /api/payments/webhook — Razorpay webhook handler ──────────────────
// Webhooks do NOT use Clerk auth — they come from Razorpay servers
router.post("/webhook", async (req: any, res) => {
  try {
    const webhookSecret = process.env["RAZORPAY_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      req.log.warn("Razorpay webhook secret not configured — skipping signature check");
      return res.json({ received: true });
    }

    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);
    const expectedSig = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (signature !== expectedSig) {
      req.log.warn("Razorpay webhook signature mismatch");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body as { event: string; payload: any };
    req.log.info({ event: event.event }, "Razorpay webhook received");

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (payment?.order_id) {
          await db
            .update(paymentsTable)
            .set({ status: "captured", razorpayPaymentId: payment.id })
            .where(eq(paymentsTable.razorpayOrderId, payment.order_id));
        }
        break;
      }
      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (payment?.order_id) {
          await db
            .update(paymentsTable)
            .set({ status: "failed" })
            .where(eq(paymentsTable.razorpayOrderId, payment.order_id));
        }
        break;
      }
      case "subscription.cancelled": {
        const sub = event.payload?.subscription?.entity;
        if (sub?.id) {
          await db
            .update(subscriptionsTable)
            .set({ status: "cancelled" })
            .where(eq(subscriptionsTable.razorpaySubscriptionId, sub.id));
        }
        break;
      }
      default:
        req.log.info({ event: event.event }, "Unhandled Razorpay webhook event");
    }

    return res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Razorpay webhook handler error");
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ─── POST /api/payments/cancel — cancel subscription ────────────────────────
router.post("/cancel", requireAuth, async (req: any, res) => {
  try {
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, req.userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

    if (!sub) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    await db
      .update(subscriptionsTable)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, sub.id));

    return res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current billing period.",
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to cancel subscription");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import {
  CreditCard, CheckCircle2, Crown, Building2, Zap,
  Clock, AlertTriangle, ArrowUpRight, RefreshCw,
  Receipt, Shield, X, Sparkles, Calendar, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
};

type BillingData = {
  plan: string;
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
};

const PLAN_META: Record<string, { label: string; color: string; icon: any; price: string }> = {
  free:       { label: "Free",       color: "#555",    icon: Zap,       price: "₹0/mo" },
  pro:        { label: "Pro",        color: "#DC2626", icon: Crown,     price: "₹2,999/mo" },
  enterprise: { label: "Enterprise", color: "#7c3aed", icon: Building2, price: "₹9,999/mo" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  past_due:  { label: "Past Due",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  trialing:  { label: "Trial",     color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
};

const PAYMENT_STATUS_META: Record<string, { label: string; color: string }> = {
  captured: { label: "Paid",    color: "#22c55e" },
  created:  { label: "Pending", color: "#f59e0b" },
  failed:   { label: "Failed",  color: "#ef4444" },
  refunded: { label: "Refunded",color: "#60a5fa" },
};

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(amount: number, currency: string) {
  if (currency === "INR") return `₹${(amount / 100).toLocaleString("en-IN")}`;
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

export default function Billing() {
  const { user } = useUser();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, histRes] = await Promise.all([
          fetch("/api/payments/subscription", { credentials: "include" }),
          fetch("/api/payments/history", { credentials: "include" }),
        ]);
        if (subRes.ok) setBilling(await subRes.json() as BillingData);
        if (histRes.ok) {
          const h = await histRes.json() as { payments: Payment[] };
          setPayments(h.payments ?? []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll retain access until the end of the current billing period.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/payments/cancel", { method: "POST", credentials: "include" });
      const data = await res.json() as any;
      if (res.ok) {
        toast({ title: "Subscription Cancelled", description: `Access continues until ${fmt(data.currentPeriodEnd)}.` });
        setBilling((b) => b ? { ...b, subscription: b.subscription ? { ...b.subscription, cancelAtPeriodEnd: true } : null } : null);
      } else {
        toast({ title: "Error", description: data.error ?? "Failed to cancel.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Request failed.", variant: "destructive" });
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#333" }} />
      </div>
    );
  }

  const plan = billing?.plan ?? "free";
  const sub = billing?.subscription;
  const isActive = billing?.hasActiveSubscription ?? false;
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const PlanIcon = meta.icon;
  const statusMeta = sub ? (STATUS_META[sub.status] ?? STATUS_META.active) : null;

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Billing</h1>
        <p className="text-sm mt-1" style={{ color: "#444" }}>
          Manage your subscription, payments, and invoices.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-2xl border p-6"
        style={{
          background: isActive
            ? `linear-gradient(160deg, ${meta.color}08, transparent)`
            : "#0d0d0d",
          borderColor: isActive ? `${meta.color}30` : "#161616",
        }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
              <PlanIcon className="w-6 h-6" style={{ color: meta.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{meta.label} Plan</h2>
                {statusMeta && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.color}30` }}>
                    {statusMeta.label}
                  </span>
                )}
                {sub?.cancelAtPeriodEnd && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                    Cancels at period end
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: "#555" }}>{meta.price}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isActive || plan === "free" ? (
              <Link href="/pricing">
                <Button className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ background: "#DC2626", color: "white" }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade Plan
                </Button>
              </Link>
            ) : plan === "pro" ? (
              <Link href="/pricing">
                <Button variant="outline" className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ borderColor: "#222", color: "#aaa", background: "#111" }}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Upgrade to Enterprise
                </Button>
              </Link>
            ) : null}
            {isActive && !sub?.cancelAtPeriodEnd && (
              <Button variant="ghost" className="text-sm font-semibold flex items-center gap-1.5"
                style={{ color: "#555", background: "#111", border: "1px solid #1e1e1e" }}
                disabled={cancelling}
                onClick={handleCancel}>
                {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Billing details grid */}
        {sub && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t" style={{ borderColor: "#1a1a1a" }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#333" }}>Billing Period Start</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar className="w-3.5 h-3.5" style={{ color: "#444" }} />
                <p className="text-sm text-white">{fmt(sub.currentPeriodStart)}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#333" }}>
                {sub.cancelAtPeriodEnd ? "Access Until" : "Next Renewal"}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: sub.cancelAtPeriodEnd ? "#f59e0b" : "#444" }} />
                <p className="text-sm" style={{ color: sub.cancelAtPeriodEnd ? "#f59e0b" : "white" }}>
                  {fmt(sub.currentPeriodEnd)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#333" }}>Payment Gateway</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield className="w-3.5 h-3.5" style={{ color: "#444" }} />
                <p className="text-sm text-white">Razorpay · Secure</p>
              </div>
            </div>
          </div>
        )}

        {/* Free plan nudge */}
        {!isActive && (
          <div className="mt-5 pt-5 border-t flex items-center gap-3" style={{ borderColor: "#1a1a1a" }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />
            <p className="text-sm" style={{ color: "#555" }}>
              You're on the free plan. Upgrade to unlock unlimited decisions, AI advisor chat, board reports, and more.
            </p>
          </div>
        )}
      </div>

      {/* What's included */}
      {isActive && plan !== "free" && (
        <div className="rounded-2xl border p-5" style={{ background: "#0a0a0a", borderColor: "#161616" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#333" }}>Included in your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
            {(plan === "pro" ? [
              "Unlimited decisions",
              "AI pattern analysis & blind spots",
              "AI Advisor chat (unlimited)",
              "Board briefing reports",
              "Gmail + Meet integrations",
              "Outcome tracking & scoring",
              "Priority email support",
              "90-day decision history",
            ] : [
              "Everything in Pro",
              "Custom integrations (Slack, Teams, Notion)",
              "Multi-user workspace",
              "Dedicated success manager",
              "SLA guarantee (99.9%)",
              "On-premise deployment option",
              "SSO / SAML",
              "Unlimited history",
            ]).map((f) => (
              <div key={f} className="flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="text-sm" style={{ color: "#888" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-4 h-4" style={{ color: "#DC2626" }} />
          <h2 className="text-base font-bold text-white">Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <CreditCard className="w-8 h-8 mx-auto mb-3" style={{ color: "#222" }} />
            <p className="text-sm font-semibold text-white">No payments yet</p>
            <p className="text-xs mt-1" style={{ color: "#3a3a3a" }}>
              Your payment receipts will appear here after your first transaction.
            </p>
            <Link href="/pricing">
              <Button className="mt-5 text-sm font-semibold flex items-center gap-1.5 mx-auto"
                style={{ background: "#DC2626", color: "white" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Subscribe Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            {/* Table header */}
            <div className="grid grid-cols-5 px-5 py-3 border-b" style={{ borderColor: "#141414" }}>
              {["Date", "Description", "Amount", "Status", "Receipt"].map((h) => (
                <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2a2a2a" }}>{h}</p>
              ))}
            </div>
            {/* Rows */}
            {payments.map((p) => {
              const pmeta = PAYMENT_STATUS_META[p.status] ?? PAYMENT_STATUS_META.created;
              const planLabel = PLAN_META[p.plan]?.label ?? p.plan;
              return (
                <div key={p.id}
                  className="grid grid-cols-5 px-5 py-4 border-b items-center hover:bg-white/[0.015] transition-colors"
                  style={{ borderColor: "#0f0f0f" }}>
                  <p className="text-sm text-white">{fmt(p.createdAt)}</p>
                  <p className="text-sm" style={{ color: "#888" }}>Decision Brain {planLabel}</p>
                  <p className="text-sm font-semibold text-white">{fmtAmount(p.amount, p.currency)}</p>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${pmeta.color}12`, color: pmeta.color, border: `1px solid ${pmeta.color}25` }}>
                      {pmeta.label}
                    </span>
                  </div>
                  <div>
                    {p.razorpayPaymentId ? (
                      <a href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-white"
                        style={{ color: "#444" }}>
                        View <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#2a2a2a" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security footer */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-3 border" style={{ background: "#090909", borderColor: "#141414" }}>
        <Shield className="w-4 h-4 shrink-0" style={{ color: "#333" }} />
        <p className="text-xs" style={{ color: "#3a3a3a" }}>
          All payments are processed securely by <strong className="text-white/30">Razorpay</strong> (PCI DSS Level 1). 
          We never store your card or bank details. For refunds or disputes, email{" "}
          <a href="mailto:support@decisionbrain.ai" className="underline" style={{ color: "#444" }}>support@decisionbrain.ai</a>.
        </p>
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
      </div>
    </div>
  );
}

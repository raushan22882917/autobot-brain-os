import { useState } from "react";
import { useUser } from "@clerk/react";
import { Check, Crown, Building2, Zap, Lock, Star, ArrowRight, Sparkles, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "₹0",
    period: "forever",
    description: "Get started with core decision intelligence.",
    icon: Zap,
    color: "#666",
    gradient: "from-white/5 to-white/0",
    border: "border-white/10",
    features: [
      "Up to 50 decisions/month",
      "Basic pattern detection",
      "Manual decision logging",
      "7-day decision history",
      "Email support",
    ],
    limitations: ["No AI advisor chat", "No board reports", "No integrations", "No outcome tracking"],
    cta: "Current Plan",
    ctaDisabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 299900,
    priceDisplay: "₹2,999",
    period: "month",
    description: "Full intelligence suite for executives who decide at scale.",
    icon: Crown,
    color: "#DC2626",
    gradient: "from-red-950/40 to-red-950/0",
    border: "border-red-500/30",
    badge: "Most Popular",
    features: [
      "Unlimited decisions",
      "AI pattern analysis & blind spots",
      "AI Advisor chat (unlimited)",
      "Board briefing reports",
      "Gmail + Meet integrations",
      "Outcome tracking & scoring",
      "Priority email support",
      "90-day decision history",
      "CSV/PDF exports",
    ],
    limitations: [],
    cta: "Get Early Access",
    ctaDisabled: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999900,
    priceDisplay: "₹9,999",
    period: "month",
    description: "Custom deployment for large teams and complex orgs.",
    icon: Building2,
    color: "#7c3aed",
    gradient: "from-violet-950/40 to-violet-950/0",
    border: "border-violet-500/30",
    features: [
      "Everything in Pro",
      "Custom integrations (Slack, Teams, Notion)",
      "Multi-user workspace",
      "Dedicated success manager",
      "SLA guarantee (99.9%)",
      "On-premise deployment option",
      "SSO / SAML",
      "Audit logs",
      "Custom AI model fine-tuning",
      "Unlimited history",
    ],
    limitations: [],
    cta: "Contact Sales",
    ctaDisabled: false,
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Pricing() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? "");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free" || planId === "enterprise") {
      if (planId === "enterprise") {
        toast({
          title: "Enterprise Sales",
          description: "Our team will reach out within 24 hours. Email: enterprise@decisionbrain.ai",
        });
      }
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json() as any;

      // Coming soon — show waitlist
      if (data.comingSoon || !res.ok) {
        setShowWaitlist(true);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ title: "Payment Error", description: "Could not load payment gateway. Please try again.", variant: "destructive" });
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Decision Brain",
        description: data.description,
        order_id: data.orderId,
        prefill: {
          name: user?.fullName ?? "",
          email: user?.primaryEmailAddress?.emailAddress ?? "",
        },
        theme: { color: "#DC2626" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
            }),
          });
          const verifyData = await verifyRes.json() as any;
          if (verifyRes.ok && verifyData.success) {
            toast({ title: "Payment Successful!", description: `Your ${data.plan} subscription is now active. Welcome aboard!` });
            window.location.href = "/dashboard";
          } else {
            toast({ title: "Verification Failed", description: "Payment received but verification failed. Contact support@decisionbrain.ai", variant: "destructive" });
          }
        },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment Cancelled", description: "You closed the payment window." });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setShowWaitlist(true);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleWaitlistSubmit = () => {
    if (!waitlistEmail) return;
    setWaitlistSubmitted(true);
    toast({ title: "You're on the list!", description: "We'll notify you the moment payments go live." });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 border"
        style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.12), rgba(220,38,38,0.03))", borderColor: "rgba(220,38,38,0.25)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(220,38,38,0.08)", transform: "translate(30%, -40%)" }} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
              <Clock className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5"
                  style={{ background: "rgba(220,38,38,0.2)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                  Coming Soon
                </Badge>
              </div>
              <h2 className="text-white font-bold text-lg">Payments launching very soon</h2>
              <p className="text-sm mt-0.5" style={{ color: "#666" }}>
                Join the waitlist to get <span style={{ color: "#DC2626" }}>3 months free</span> when we go live + early access to all premium features.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowWaitlist(true)}
            className="shrink-0 font-semibold flex items-center gap-2"
            style={{ background: "#DC2626", color: "white" }}
          >
            <Star className="w-4 h-4" />
            Join Waitlist
          </Button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="relative w-full max-w-md rounded-2xl p-8 border"
            style={{ background: "#0d0d0d", borderColor: "rgba(220,38,38,0.3)" }}>
            <button
              onClick={() => setShowWaitlist(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {!waitlistSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
                    <Sparkles className="w-6 h-6" style={{ color: "#DC2626" }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Get Early Access</h3>
                    <p className="text-sm" style={{ color: "#555" }}>3 months free + lifetime discount</p>
                  </div>
                </div>
                <p className="text-sm mb-6" style={{ color: "#666" }}>
                  Payments are coming soon. Join our waitlist and we'll give you <span className="text-white font-semibold">3 months of Pro for free</span> when we launch — plus a <span style={{ color: "#DC2626" }}>40% lifetime discount</span>.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-2"
                    style={{
                      background: "#151515",
                      border: "1px solid #222",
                      focusRingColor: "#DC2626",
                    }}
                  />
                  <Button
                    className="w-full font-semibold py-3 flex items-center justify-center gap-2"
                    style={{ background: "#DC2626", color: "white" }}
                    onClick={handleWaitlistSubmit}
                    disabled={!waitlistEmail}
                  >
                    <Star className="w-4 h-4" />
                    Reserve My Spot
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">You're on the list!</h3>
                <p className="text-sm" style={{ color: "#666" }}>
                  We'll email <span className="text-white">{waitlistEmail}</span> the moment we launch — with your exclusive 3 months free.
                </p>
                <Button
                  className="mt-6 font-medium"
                  variant="outline"
                  style={{ borderColor: "#222", color: "#888" }}
                  onClick={() => setShowWaitlist(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif font-bold text-white tracking-tight">
          Intelligence Built for Executives
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#555" }}>
          Every plan includes a 14-day free trial. No credit card required to start.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border flex flex-col transition-all ${plan.border} ${isPro ? "ring-1 ring-red-500/20" : ""}`}
              style={{
                background: isPro
                  ? "linear-gradient(160deg, rgba(220,38,38,0.08), rgba(0,0,0,0))"
                  : plan.id === "enterprise"
                    ? "linear-gradient(160deg, rgba(124,58,237,0.06), rgba(0,0,0,0))"
                    : "#0d0d0d",
                borderColor: isPro ? "rgba(220,38,38,0.3)"
                  : plan.id === "enterprise" ? "rgba(124,58,237,0.25)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 text-white"
                    style={{ background: "#DC2626", boxShadow: "0 0 20px rgba(220,38,38,0.4)" }}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                  </div>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{plan.priceDisplay}</span>
                  {plan.price > 0 && (
                    <span className="text-sm mb-1.5" style={{ color: "#444" }}>/{plan.period}</span>
                  )}
                  {plan.price === 0 && (
                    <span className="text-sm mb-1.5" style={{ color: "#444" }}>{plan.period}</span>
                  )}
                </div>
                <p className="text-sm" style={{ color: "#555" }}>{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.color }} />
                    <span className="text-sm" style={{ color: "#aaa" }}>{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-2.5 opacity-40">
                    <X className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
                    <span className="text-sm" style={{ color: "#555" }}>{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-2">
                {plan.price > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    <Lock className="w-3 h-3" style={{ color: "#444" }} />
                    <span className="text-[11px]" style={{ color: "#444" }}>Secured by Razorpay</span>
                  </div>
                )}
                <Button
                  className="w-full font-semibold py-2.5 flex items-center justify-center gap-2 transition-all"
                  disabled={plan.ctaDisabled || loadingPlan === plan.id}
                  onClick={() => handleSubscribe(plan.id)}
                  style={
                    plan.id === "pro"
                      ? { background: "#DC2626", color: "white" }
                      : plan.id === "enterprise"
                        ? { background: "#7c3aed", color: "white" }
                        : { background: "#151515", color: "#555", border: "1px solid #222" }
                  }
                >
                  {loadingPlan === plan.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {plan.id === "pro" && <Sparkles className="w-4 h-4" />}
                      {plan.id === "enterprise" && <ArrowRight className="w-4 h-4" />}
                      {plan.cta}
                    </>
                  )}
                </Button>
                {plan.id === "pro" && (
                  <p className="text-center text-[11px]" style={{ color: "#444" }}>
                    14-day free trial · Cancel anytime
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Signals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Payment Security", value: "Bank-grade SSL", icon: Lock },
          { label: "Gateway", value: "Razorpay", icon: Zap },
          { label: "Free Trial", value: "14 days", icon: Star },
          { label: "Cancellation", value: "Anytime", icon: Check },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl p-4 text-center border" style={{ background: "#0d0d0d", borderColor: "#161616" }}>
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#DC2626" }} />
              <p className="text-white font-semibold text-sm">{item.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl p-6 border" style={{ background: "#0d0d0d", borderColor: "#161616" }}>
        <h3 className="text-white font-bold text-xl mb-6">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: "When will payments go live?",
              a: "We're finalizing Razorpay onboarding and expect to go live within a few weeks. Join the waitlist for early access.",
            },
            {
              q: "Which payment methods are supported?",
              a: "Razorpay supports UPI, credit/debit cards, net banking, wallets (Paytm, PhonePe), and EMI options.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel anytime from Settings → Billing. Your access continues until the end of the billing period.",
            },
            {
              q: "Is my payment data secure?",
              a: "All payments are processed by Razorpay, which is PCI DSS Level 1 certified. We never store card details.",
            },
            {
              q: "Do you offer refunds?",
              a: "Yes, we offer a full refund within 7 days of subscription if you're not satisfied.",
            },
            {
              q: "What currency are prices in?",
              a: "All prices are in Indian Rupees (INR). Enterprise customers can request USD/USD billing.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="text-white font-semibold text-sm mb-1.5">{faq.q}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

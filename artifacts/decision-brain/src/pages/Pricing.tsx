import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Check, Crown, Building2, Zap, Lock, Star, ArrowRight, Sparkles, X, Shield, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/apiUrl";
import { PublicLayout } from "@/components/PublicLayout";

const PLANS = [
  { id: "free", name: "Free", price: 0, priceDisplay: "₹0", period: "forever", description: "Get started with core decision intelligence.", icon: Zap, color: "#666", features: ["Up to 50 decisions/month", "Basic pattern detection", "Manual decision logging", "7-day decision history", "Email support"], limitations: ["No AI advisor chat", "No board reports", "No integrations", "No outcome tracking"], cta: "Current Plan", ctaDisabled: true },
  { id: "pro", name: "Pro", price: 299900, priceDisplay: "₹2,999", period: "month", description: "Full intelligence suite for executives who decide at scale.", icon: Crown, color: "#DC2626", badge: "Most Popular", features: ["Unlimited decisions", "AI pattern analysis & blind spots", "AI Advisor chat (unlimited)", "Board briefing reports", "Gmail + Meet integrations", "Outcome tracking & scoring", "Priority email support", "90-day decision history", "CSV / PDF exports"], limitations: [], cta: "Subscribe Now", ctaDisabled: false },
  { id: "enterprise", name: "Enterprise", price: 999900, priceDisplay: "₹9,999", period: "month", description: "Custom deployment for large teams and complex orgs.", icon: Building2, color: "#7c3aed", features: ["Everything in Pro", "Custom integrations (Slack, Teams, Notion)", "Multi-user workspace", "Dedicated success manager", "SLA guarantee (99.9%)", "On-premise deployment option", "SSO / SAML", "Audit logs", "Custom AI model fine-tuning", "Unlimited history"], limitations: [], cta: "Contact Sales", ctaDisabled: false },
];

declare global { interface Window { Razorpay: any; } }

function loadRazorpayScript(): Promise<boolean> { return new Promise((resolve) => { if (window.Razorpay) { resolve(true); return; } const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); }); }

type Subscription = { plan: string; status: string; currentPeriodEnd?: string };

export default function Pricing() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activePlan, setActivePlan] = useState<string>("free");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiUrl("/payments/subscription"), { credentials: "include" });
        if (res.ok) { const data = await res.json() as any; setActivePlan(data.plan ?? "free"); setSubscription(data.subscription); }
      } catch {}
    };
    load();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    if (planId === "enterprise") { toast({ title: "Enterprise Sales", description: "Our team will reach out within 24 hours. Email: enterprise@decisionbrain.ai" }); return; }
    setLoadingPlan(planId);
    try {
      const res = await fetch(apiUrl("/payments/create-order"), { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ plan: planId }) });
      const data = await res.json() as any;
      if (!res.ok || data.error) { toast({ title: "Payment Error", description: data.error ?? "Failed to create order. Please try again.", variant: "destructive" }); return; }
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast({ title: "Payment Error", description: "Could not load payment gateway. Please try again.", variant: "destructive" }); return; }
      const options = { key: data.keyId, amount: data.amount, currency: data.currency, name: "Autobot360", description: data.description, order_id: data.orderId, prefill: { name: user?.fullName ?? "", email: user?.primaryEmailAddress?.emailAddress ?? "" }, theme: { color: "#DC2626" }, handler: async (response: any) => { const verifyRes = await fetch(apiUrl("/payments/verify"), { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, plan: planId }) }); const verifyData = await verifyRes.json() as any; if (verifyRes.ok && verifyData.success) { setActivePlan(planId); toast({ title: "Payment Successful!", description: `Your ${data.plan} subscription is now active. Welcome aboard!` }); window.location.href = "/dashboard"; } else { toast({ title: "Verification Failed", description: "Payment received but verification failed. Contact support@decisionbrain.ai", variant: "destructive" }); } }, modal: { ondismiss: () => toast({ title: "Payment Cancelled", description: "You closed the payment window." }) } };
      const rzp = new window.Razorpay(options); rzp.open();
    } catch { toast({ title: "Payment Error", description: "Something went wrong. Please try again.", variant: "destructive" }); } finally { setLoadingPlan(null); }
  };

  const isCurrentPlan = (planId: string) => planId === activePlan;

  return (
    <PublicLayout>
      <div className="px-6 md:px-10 py-16">
        <div className="max-w-7xl mx-auto space-y-12">
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>Pricing</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Intelligence Built for Executives</h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">Every plan includes a 14-day free trial. No credit card required to start.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[{ label: "Secure checkout" }, { label: "Flexible billing" }, { label: "Cancel anytime" }].map((item) => <div key={item.label} className="rounded-3xl border border-white/10 p-4 bg-[#0d0d0d] text-sm text-white/60">{item.label}</div>)}
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80" alt="Pricing and business growth" className="w-full h-[420px] object-cover" />
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isPro = plan.id === "pro";
              const isEnterprise = plan.id === "enterprise";
              const isCurrent = isCurrentPlan(plan.id);
              return (
                <div key={plan.id} className={`relative rounded-3xl p-6 border flex flex-col transition-all ${isPro ? "ring-1 ring-red-500/20" : ""}`} style={{ background: isPro ? "linear-gradient(160deg, rgba(220,38,38,0.08), rgba(0,0,0,0))" : isEnterprise ? "linear-gradient(160deg, rgba(124,58,237,0.06), rgba(0,0,0,0))" : "#0d0d0d", borderColor: isPro ? "rgba(220,38,38,0.3)" : isEnterprise ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)" }}>
                  {plan.badge && !isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 text-white" style={{ background: "#DC2626" }}>{plan.badge}</Badge></div>}
                  {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="text-[10px] font-bold tracking-widest uppercase px-3 py-1" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>Active Plan</Badge></div>}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}><Icon className="w-5 h-5" style={{ color: plan.color }} /></div><h3 className="text-white font-bold text-lg">{plan.name}</h3></div>
                    <div className="flex items-end gap-1 mb-2"><span className="text-4xl font-black text-white">{plan.priceDisplay}</span><span className="text-sm mb-1.5" style={{ color: "#444" }}>{plan.price > 0 ? `/${plan.period}` : plan.period}</span></div>
                    <p className="text-sm" style={{ color: "#555" }}>{plan.description}</p>
                  </div>
                  <div className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => <div key={feature} className="flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.color }} /><span className="text-sm" style={{ color: "#aaa" }}>{feature}</span></div>)}
                    {plan.limitations.map((limitation) => <div key={limitation} className="flex items-start gap-2.5 opacity-40"><X className="w-4 h-4 mt-0.5 shrink-0 text-white/30" /><span className="text-sm" style={{ color: "#555" }}>{limitation}</span></div>)}
                  </div>
                  <div className="space-y-2">
                    {plan.price > 0 && <div className="flex items-center justify-center gap-1.5 mb-3"><Lock className="w-3 h-3" style={{ color: "#444" }} /><span className="text-[11px]" style={{ color: "#444" }}>Secured by Razorpay · UPI · Cards · Net Banking</span></div>}
                    <Button className="w-full font-semibold py-2.5 flex items-center justify-center gap-2 transition-all" disabled={plan.ctaDisabled || isCurrent || loadingPlan === plan.id} onClick={() => handleSubscribe(plan.id)} style={isCurrent ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" } : plan.id === "pro" ? { background: "#DC2626", color: "white" } : plan.id === "enterprise" ? { background: "#7c3aed", color: "white" } : { background: "#151515", color: "#555", border: "1px solid #222" }}>{loadingPlan === plan.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : isCurrent ? <><CheckCircle2 className="w-4 h-4" /> Active</> : <>{plan.id === "pro" && <Sparkles className="w-4 h-4" />}{plan.id === "enterprise" && <ArrowRight className="w-4 h-4" />}{plan.cta}</>}</Button>
                    {plan.id === "pro" && !isCurrent && <p className="text-center text-[11px]" style={{ color: "#444" }}>14-day free trial · Cancel anytime</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <section className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Which payment methods are supported?", a: "Razorpay supports UPI, credit/debit cards, net banking, wallets, and EMI options." },
              { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from Settings → Billing. Access continues until the end of the period." },
            ].map((faq) => <div key={faq.q} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]"><p className="text-white font-semibold mb-2">{faq.q}</p><p className="text-white/50 text-sm leading-relaxed">{faq.a}</p></div>)}
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

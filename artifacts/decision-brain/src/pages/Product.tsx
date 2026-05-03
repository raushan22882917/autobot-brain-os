import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, Shield, Sparkles, Network, Loader2, Image as ImageIcon, Workflow, Bot } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { PublicLayout } from "@/components/PublicLayout";

const DEFAULT_CONTENT = {
  title: "How Autobot360 works",
  subtitle: "Autobot360 captures decisions, connects your tools, and turns every outcome into a better next move.",
  features: [
    { title: "Private by design", text: "Built for secure, read-only decision capture." },
    { title: "AI insights", text: "Find patterns, risks, and follow-ups automatically." },
    { title: "Connected sources", text: "Bring in email, meetings, chat, and docs." },
  ],
};

const STEPS = [
  { title: "Capture", text: "Decisions are captured from meetings, email, and chat.", icon: BrainCircuit },
  { title: "Analyze", text: "AI finds patterns, risk signals, and context.", icon: Bot },
  { title: "Act", text: "Follow-ups and outcomes are tracked over time.", icon: Workflow },
];

export default function Product() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/public/product"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const title = data?.title ?? DEFAULT_CONTENT.title;
  const subtitle = data?.subtitle ?? DEFAULT_CONTENT.subtitle;
  const features: { title: string; text: string }[] = (data?.content as any)?.features ?? DEFAULT_CONTENT.features;

  return (
    <PublicLayout>
      <div className="px-6 md:px-10 py-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#DC2626" }}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>Product</p>
              </div>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h1>}
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">{subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <a href="/pricing" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl" style={{ background: "#DC2626", color: "#fff" }}>
                  View pricing <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a href="/integrations-public" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl border border-white/10 text-white bg-white/5">
                  See integrations
                </a>
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80" alt="Product dashboard" className="w-full h-[420px] object-cover" />
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {features.map((item, i) => {
              const Icon = [Shield, Sparkles, Network][i % 3];
              return (
                <div key={item.title} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]">
                  <Icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
                  <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                  <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {STEPS.map((step, idx) => (
              <div key={step.title} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(220,38,38,0.12)" }}>
                  <step.icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">0{idx + 1}</p>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

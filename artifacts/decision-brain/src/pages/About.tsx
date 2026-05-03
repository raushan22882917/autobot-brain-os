import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, Shield, Users, Sparkles, Loader2, Brain, Target, Landmark } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { PublicLayout } from "@/components/PublicLayout";

const DEFAULT_CONTENT = {
  title: "Built for better decisions",
  subtitle: "Autobot360 helps founders and teams capture decisions, connect context, and learn from outcomes with a premium, privacy-first experience.",
  pillars: [
    { title: "Private by design", text: "Read-only integrations and secure handling." },
    { title: "Team ready", text: "Shared intelligence across leaders and operators." },
    { title: "AI assisted", text: "Surface patterns, risks, and follow-ups automatically." },
  ],
};

const STORY = [
  { icon: Brain, title: "Capture", text: "Every key decision is captured in one place." },
  { icon: Target, title: "Measure", text: "Track outcomes against intent over time." },
  { icon: Landmark, title: "Improve", text: "Build better judgment across the organization." },
];

export default function About() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/public/about"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const title = data?.title ?? DEFAULT_CONTENT.title;
  const subtitle = data?.subtitle ?? DEFAULT_CONTENT.subtitle;
  const pillars: { title: string; text: string }[] = (data?.content as any)?.pillars ?? DEFAULT_CONTENT.pillars;

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
                <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>About</p>
              </div>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white/40" />
              ) : (
                <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h1>
              )}
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">{subtitle}</p>
              <div className="flex flex-wrap gap-3 text-sm text-white/60">
                <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5">Leadership intelligence</span>
                <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5">Private workflows</span>
                <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5">Outcome tracking</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/product" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl" style={{ background: "#DC2626", color: "#fff" }}>
                  Explore product <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a href="/contact" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl border border-white/10 text-white bg-white/5">
                  Talk to us
                </a>
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1529119368496-2dfda6ec2804?w=1400&q=80" alt="Team discussing strategy" className="w-full h-[420px] object-cover" />
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {pillars.map((item, i) => {
              const Icon = [Shield, Users, Sparkles][i % 3];
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
            {STORY.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]">
                <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

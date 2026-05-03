import { useEffect, useState } from "react";
import { ArrowRight, Mail, Video, MessageSquare, NotepadText, Globe, Loader2, Plug, Cloud, ChevronRight, Sparkles, Layers3 } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { PublicLayout } from "@/components/PublicLayout";

const ICON_LIST = [Mail, Video, MessageSquare, NotepadText, Globe];

const DEFAULT_ITEMS = [
  { name: "Gmail", desc: "Capture decisions from email threads." },
  { name: "Google Meet", desc: "Pull action items from meetings." },
  { name: "Slack", desc: "Watch for commitments in channels." },
  { name: "Notion", desc: "Sync knowledge bases and docs." },
  { name: "More coming", desc: "Teams, Zoom, Outlook, DocuSign." },
];

const PLATFORM_FEATURES = [
  { icon: Plug, title: "Easy connections", text: "Securely connect the apps your team already uses." },
  { icon: Cloud, title: "Always syncing", text: "Keep decision context fresh without manual updates." },
  { icon: MessageSquare, title: "Cross-channel", text: "Capture signals from chat, email, meetings, and docs." },
];

const STACK_ITEMS = [
  { name: "Gmail", desc: "Capture decisions from email threads." },
  { name: "Google Meet", desc: "Pull action items from meetings." },
  { name: "Slack", desc: "Watch for commitments in channels." },
  { name: "Notion", desc: "Sync knowledge bases and docs." },
  { name: "Teams", desc: "Bring in team conversation context." },
  { name: "Zoom", desc: "Extract follow-ups from calls." },
  { name: "Outlook", desc: "Track commitments across inboxes." },
  { name: "DocuSign", desc: "See signature status and approvals." },
  { name: "More coming", desc: "New connectors ship regularly." },
];

export default function IntegrationsPublic() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/public/integrations"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const title = data?.title ?? "Integrations";
  const subtitle = data?.subtitle ?? "See the list of supported tools Autobot360 can connect to.";
  const items: { name: string; desc: string }[] = (data?.content as any)?.items ?? STACK_ITEMS;

  return (
    <PublicLayout>
      <div className="px-6 md:px-10 py-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>Integrations</p>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h1>}
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">{subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <a href="/contact" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl" style={{ background: "#DC2626", color: "#fff" }}>
                  Request a connector <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a href="/product" className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl border border-white/10 text-white bg-white/5">
                  View product
                </a>
              </div>
            </div>
            <div className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(13,13,13,0.95))] shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.16),transparent_55%)]" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45 mb-5">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  Connected stack
                </div>
                <div className="grid grid-cols-2 gap-4 perspective-[1200px]">
                  {items.slice(0, 6).map((item, index) => {
                    const Icon = ICON_LIST[index % ICON_LIST.length];
                    const tilt = index % 2 === 0 ? "-rotate-3" : "rotate-3";
                    return (
                      <div key={item.name} className={`relative rounded-2xl border border-white/10 bg-[#121212] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${tilt}`}>
                        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
                        <div className="relative">
                          <Icon className="w-5 h-5 mb-4 text-red-300" />
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="text-white/50 text-sm leading-relaxed mt-1">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Full integration list</p>
                    <p className="text-xs text-white/45">Everything your team needs, in one living stack.</p>
                  </div>
                  <Layers3 className="w-5 h-5 text-red-300" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {PLATFORM_FEATURES.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]">
                <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </section>

          <section>
            <div className="grid md:grid-cols-3 gap-4">
              {items.map((item, i) => {
                const Icon = ICON_LIST[i % ICON_LIST.length];
                return (
                  <div key={item.name} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d] shadow-[0_16px_40px_rgba(0,0,0,0.35)] transform-gpu hover:-translate-y-1 transition-transform">
                    <Icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
                    <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

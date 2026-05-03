import { useEffect, useState } from "react";
import { ArrowRight, Mail, Video, MessageSquare, NotepadText, Globe, Loader2, Plug, Cloud } from "lucide-react";
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
  const items: { name: string; desc: string }[] = (data?.content as any)?.items ?? DEFAULT_ITEMS;

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
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=80" alt="Integration stack" className="w-full h-[420px] object-cover" />
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
                  <div key={item.name} className="rounded-3xl border border-white/10 p-6 bg-[#0d0d0d]">
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

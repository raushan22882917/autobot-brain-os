import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Video, MessageSquare, NotepadText, Globe, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";

const ICON_LIST = [Mail, Video, MessageSquare, NotepadText, Globe];

const DEFAULT_ITEMS = [
  { name: "Gmail", desc: "Capture decisions from email threads." },
  { name: "Google Meet", desc: "Pull action items from meetings." },
  { name: "Slack", desc: "Watch for commitments in channels." },
  { name: "Notion", desc: "Sync knowledge bases and docs." },
  { name: "More coming", desc: "Teams, Zoom, Outlook, DocuSign." },
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
  const items: { name: string; desc: string }[] =
    (data?.content as any)?.items ?? DEFAULT_ITEMS;

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#DC2626" }}>Integrations</p>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          ) : (
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h1>
          )}
          <p className="text-white/60 max-w-3xl leading-relaxed mt-3">{subtitle}</p>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <Link href="/about"><span className="hover:text-white cursor-pointer transition-colors">About</span></Link>
          <Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link>
          <Link href="/product"><span className="hover:text-white cursor-pointer transition-colors">Product</span></Link>
          <Link href="/pricing"><span className="hover:text-white cursor-pointer transition-colors">Pricing</span></Link>
        </div>

        {/* Integration cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const Icon = ICON_LIST[i % ICON_LIST.length];
            return (
              <div key={item.name} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
                <Icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
                <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <Link href="/contact">
          <span className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl cursor-pointer" style={{ background: "#DC2626", color: "#fff" }}>
            Request a connector <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </Link>
      </div>
    </div>
  );
}

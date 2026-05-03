import { Link } from "wouter";
import { ArrowRight, Mail, Video, MessageSquare, NotepadText, Globe } from "lucide-react";

const items = [
  { icon: Mail, name: "Gmail", desc: "Capture decisions from email threads." },
  { icon: Video, name: "Google Meet", desc: "Pull action items from meetings." },
  { icon: MessageSquare, name: "Slack", desc: "Watch for commitments in channels." },
  { icon: NotepadText, name: "Notion", desc: "Sync knowledge bases and docs." },
  { icon: Globe, name: "More coming", desc: "Teams, Zoom, Outlook, DocuSign." },
];

export default function IntegrationsPublic() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Integrations</h1>
        <p className="text-white/60 max-w-3xl leading-relaxed">See the list of supported tools Autobot360 can connect to.</p>
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link>
          <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          <Link href="/product"><span className="hover:text-white cursor-pointer">Product</span></Link>
          <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.name} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
              <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
              <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
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
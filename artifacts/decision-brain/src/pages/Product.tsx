import { Link } from "wouter";
import { ArrowRight, BrainCircuit, Shield, Sparkles, Network } from "lucide-react";

export default function Product() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DC2626" }}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>Product</p>
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>How Autobot360 works</h1>
          </div>
        </div>
        <p className="text-white/60 text-lg max-w-3xl leading-relaxed">
          Autobot360 captures decisions, connects your tools, and turns every outcome into a better next move.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link>
          <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
          <Link href="/integrations-public"><span className="hover:text-white cursor-pointer">Integrations</span></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Private by design", text: "Built for secure, read-only decision capture." },
            { icon: Sparkles, title: "AI insights", text: "Find patterns, risks, and follow-ups automatically." },
            { icon: Network, title: "Connected sources", text: "Bring in email, meetings, chat, and docs." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
              <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing">
          <span className="inline-flex items-center text-sm font-semibold px-5 py-3 rounded-xl cursor-pointer" style={{ background: "#DC2626", color: "#fff" }}>
            View pricing <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </Link>
      </div>
    </div>
  );
}
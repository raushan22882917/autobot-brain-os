import { Link } from "wouter";
import { BrainCircuit, Shield, Users, Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DC2626" }}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>About</p>
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Built for better decisions</h1>
          </div>
        </div>
        <p className="text-white/60 text-lg max-w-3xl leading-relaxed">
          Autobot360 helps founders and teams capture decisions, connect context, and learn from outcomes with a premium, privacy-first experience.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Private by design", text: "Read-only integrations and secure handling." },
            { icon: Users, title: "Team ready", text: "Shared intelligence across leaders and operators." },
            { icon: Sparkles, title: "AI assisted", text: "Surface patterns, risks, and follow-ups automatically." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
              <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <Link href="/contact">
          <span className="inline-flex text-sm font-semibold px-5 py-3 rounded-xl cursor-pointer" style={{ background: "#DC2626", color: "#fff" }}>
            Contact us
          </span>
        </Link>
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <Link href="/product"><span className="hover:text-white cursor-pointer">Product</span></Link>
          <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
          <Link href="/integrations"><span className="hover:text-white cursor-pointer">Integrations</span></Link>
        </div>
      </div>
    </div>
  );
}
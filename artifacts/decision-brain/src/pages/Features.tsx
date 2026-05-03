import { Zap, Network, Target } from "lucide-react";

const items = [
  { icon: Zap, title: "Silent Capture", text: "Capture decisions without extra work." },
  { icon: Network, title: "Pattern Detection", text: "See repeat mistakes and blind spots." },
  { icon: Target, title: "Outcome Tracking", text: "Measure results against intent." },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Features</h1>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
              <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
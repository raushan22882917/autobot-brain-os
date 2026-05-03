import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#DC2626" }}>Contact</p>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Talk to the team</h1>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Mail, title: "Email", text: "hello@autobot360.ai" },
            { icon: Phone, title: "Phone", text: "+1 (555) 012-3456" },
            { icon: MapPin, title: "Office", text: "Remote-first, global team" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 p-6" style={{ background: "#0d0d0d" }}>
              <item.icon className="w-5 h-5 mb-4" style={{ color: "#F87171" }} />
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-white/50 text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Phone, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/public/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 md:px-10 py-16">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#DC2626" }}>Contact</p>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Talk to the team</h1>
        </div>

        {/* Info cards */}
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

        {/* Contact form */}
        {sent ? (
          <div className="rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-4 text-center" style={{ background: "#0d0d0d" }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <h2 className="text-2xl font-bold">Message sent!</h2>
            <p className="text-white/50 text-sm">We'll get back to you within 1 business day.</p>
            <button
              onClick={() => { setSent(false); setForm({ name: "", email: "", company: "", message: "" }); }}
              className="text-sm text-white/40 hover:text-white transition-colors mt-2"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 p-8 space-y-5" style={{ background: "#0d0d0d" }}>
            <h2 className="text-xl font-semibold mb-2">Send us a message</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors"
                  style={{ background: "#111" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors"
                  style={{ background: "#111" }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Company</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Corp"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors"
                style={{ background: "#111" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">Message *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what you'd like to discuss..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors resize-none"
                style={{ background: "#111" }}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#DC2626", color: "#fff" }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}

        {/* Nav links */}
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <Link href="/about"><span className="hover:text-white cursor-pointer transition-colors">About</span></Link>
          <Link href="/product"><span className="hover:text-white cursor-pointer transition-colors">Product</span></Link>
          <Link href="/pricing"><span className="hover:text-white cursor-pointer transition-colors">Pricing</span></Link>
          <Link href="/integrations-public"><span className="hover:text-white cursor-pointer transition-colors">Integrations</span></Link>
        </div>
      </div>
    </div>
  );
}

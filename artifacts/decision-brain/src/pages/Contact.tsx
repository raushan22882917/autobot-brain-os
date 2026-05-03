import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Phone, MapPin, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { PublicLayout } from "@/components/PublicLayout";

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
    <PublicLayout>
      <div className="px-6 md:px-10 py-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#DC2626" }}>Contact</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Talk to the team</h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">Need a demo, a custom connector, or help choosing a plan? Reach out and we’ll respond quickly.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Mail, title: "Email", text: "hello@autobot360.ai" },
                  { icon: Phone, title: "Phone", text: "+1 (555) 012-3456" },
                  { icon: MapPin, title: "Office", text: "Remote-first, global team" },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 p-5 bg-[#0d0d0d]">
                    <item.icon className="w-5 h-5 mb-3" style={{ color: "#F87171" }} />
                    <h2 className="text-base font-semibold mb-1">{item.title}</h2>
                    <p className="text-white/50 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80" alt="Support team" className="w-full h-[420px] object-cover" />
            </div>
          </section>

          <section className="grid lg:grid-cols-2 gap-8">
            <div className="rounded-[2rem] border border-white/10 p-8 bg-[#0d0d0d]">
              {sent ? (
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center gap-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <h2 className="text-2xl font-bold">Message sent!</h2>
                  <p className="text-white/50 text-sm">We’ll get back to you within 1 business day.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.12)" }}>
                      <MessageSquare className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Send us a message</h2>
                      <p className="text-white/40 text-sm">We’ll reply by email.</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors" style={{ background: "#111" }} />
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors" style={{ background: "#111" }} />
                  </div>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors" style={{ background: "#111" }} />
                  <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you'd like to discuss..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 outline-none focus:border-red-500/50 transition-colors resize-none" style={{ background: "#111" }} />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={sending} className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "#DC2626", color: "#fff" }}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
            <div className="rounded-[2rem] border border-white/10 p-8 bg-[#0d0d0d] space-y-4">
              <h2 className="text-xl font-semibold">Quick links</h2>
              <div className="grid gap-3 text-sm text-white/60">
                <Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link>
                <Link href="/product"><span className="hover:text-white cursor-pointer">Product</span></Link>
                <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
                <Link href="/integrations-public"><span className="hover:text-white cursor-pointer">Integrations</span></Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

import { Link } from "wouter";
import { BrainCircuit, Shield, Zap, Target, ChevronRight, Network, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import logoImage from "@assets/logo_1777805810138.png";
const motionEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.12, ease: motionEase } }),
};

const STATS = [
  { value: "94%", label: "Decision recall accuracy" },
  { value: "3.2×", label: "Faster pattern recognition" },
  { value: "68%", label: "Reduction in repeated mistakes" },
  { value: "<2 min", label: "Setup per integration" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Silent Capture",
    desc: "Connects to Gmail, Slack, Zoom, and Teams to extract decisions as they happen — zero manual entry.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  },
  {
    icon: Network,
    title: "Pattern Detection",
    desc: "AI surfaces repeated mistakes, urgency bias, and cognitive blind spots across your entire decision history.",
    img: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&q=80",
  },
  {
    icon: Target,
    title: "Outcome Tracking",
    desc: "Auto-follows up at 30, 90, and 180 days to score real-world outcomes against original intent.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
];

const TESTIMONIALS = [
  {
    quote: "Autobot360 surfaced a pattern I'd been blind to for two years — I was consistently under-resourced in Q3. The data was all there, I just couldn't see it.",
    name: "CEO, Series C Fintech",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&q=80",
  },
  {
    quote: "I used to think I had good instincts. Now I know which instincts to trust — and which ones cost me seven figures.",
    name: "Managing Partner, PE Fund",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80",
  },
  {
    quote: "Our board asked why our strategic decisions improved so dramatically in 18 months. Honestly? We started measuring them.",
    name: "COO, Fortune 500 Division",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050505", color: "#ffffff", fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl" style={{ background: "rgba(5,5,5,0.85)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImage} alt="Autobot360 logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-xl tracking-tight text-white">Autobot360</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <Link href="/about">
              <span className="hover:text-white transition-colors cursor-pointer">About</span>
            </Link>
            <Link href="/contact">
              <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <span className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer px-3 py-2">
                Log in
              </span>
            </Link>
            <Link href="/sign-up">
              <span className="text-sm font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#DC2626", color: "#fff" }}>
                Get Access
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.25) saturate(0.8)" }}
            />
            {/* Red vignette overlay */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(220,38,38,0.18) 0%, transparent 70%)" }} />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to bottom, transparent, #050505)" }} />
            {/* Left fade */}
            <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: "linear-gradient(to right, rgba(5,5,5,0.85), transparent)" }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-24 grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8 tracking-widest uppercase"
                style={{ borderColor: "rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#F87171" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#DC2626" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#DC2626" }} />
                </span>
                Now operating in stealth
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                The intelligence engine for{" "}
                <span style={{ color: "#DC2626" }}>executive</span>{" "}
                decisions.
              </h1>

              <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-lg">
                Autobot360 silently captures your choices, detects patterns, tracks outcomes, and alerts you to blind spots before they become liabilities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <div className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base cursor-pointer transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "#DC2626", color: "#fff" }}>
                    Start Operating
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
                <Link href="/sign-in">
                  <div className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base cursor-pointer border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition-all">
                    <Shield className="w-4 h-4" />
                    Enterprise login
                  </div>
                </Link>
              </div>

              {/* Trust line */}
              <p className="text-xs text-white/40 mt-6 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                SOC 2 Type II · Zero data sold · Read-only integrations
              </p>
            </motion.div>

            {/* Hero visual — animated image */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="hidden md:block">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0b0b] p-5">
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#F87171" }}>
                  How second brain works
                </p>
                <img
                  src={`${import.meta.env.BASE_URL}images/second-brain-hero-premium.png`}
                  alt="How Autobot360 works for founders"
                  className="block w-full h-auto object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────── */}
        <section id="proof" className="border-y border-white/8" style={{ background: "#0d0d0d" }}>
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center">
                <p className="text-4xl font-bold mb-1" style={{ color: "#DC2626" }}>{s.value}</p>
                <p className="text-sm text-white/50">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" className="py-28 px-6 md:px-10" style={{ background: "#050505" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-20 text-center">
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>How it works</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Every choice, quantified.
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Stop relying on instinct alone. Build a compounding database of your executive judgment.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="group rounded-2xl overflow-hidden border border-white/8 flex flex-col hover:border-red-700/50 transition-colors"
                  style={{ background: "#0d0d0d" }}>
                  {/* Image */}
                  <div className="h-44 overflow-hidden relative">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      style={{ filter: "brightness(0.5) saturate(0.7)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #0d0d0d)" }} />
                    <div className="absolute bottom-4 left-4 p-2.5 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
                      <f.icon className="w-5 h-5" style={{ color: "#F87171" }} />
                    </div>
                  </div>
                  {/* Text */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                    <p className="text-white/50 leading-relaxed text-sm flex-1">{f.desc}</p>
                    <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#DC2626" }}>
                      Learn more <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FULL-WIDTH IMAGE BREAK ────────────────────────────── */}
        <section className="relative h-72 md:h-96 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80"
            alt="Executive boardroom"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.3) saturate(0.6)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.25) 0%, rgba(5,5,5,0.8) 100%)" }}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center px-6">
              <p className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                What would you do with{" "}
                <span style={{ color: "#F87171" }}>perfect decision memory?</span>
              </p>
              <Link href="/sign-up">
                <div className="inline-flex items-center gap-2 mt-6 px-8 py-4 rounded-xl font-bold cursor-pointer transition-all hover:opacity-90"
                  style={{ background: "#DC2626", color: "#fff" }}>
                  Find out — it's free <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────── */}
        <section id="testimonials" className="py-28 px-6 md:px-10" style={{ background: "#050505" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16 text-center">
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>From the field</p>
              <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Executives who trusted the data.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="p-8 rounded-2xl border border-white/8 flex flex-col" style={{ background: "#0d0d0d" }}>
                  {/* Red quote mark */}
                  <span className="text-6xl font-serif leading-none mb-4" style={{ color: "#DC2626" }}>"</span>
                  <p className="text-white/80 leading-relaxed flex-1 text-sm">{t.quote}</p>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/8">
                    <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <p className="text-xs text-white/50 font-medium">{t.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────── */}
        <section className="py-28 px-6 md:px-10">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative text-center px-8 py-20"
            style={{ background: "#DC2626" }}>
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative z-10">
              <TrendingUp className="w-12 h-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Start building your decision OS today.
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Join the executives who treat decision-making as a discipline — not a guessing game.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up">
                  <div className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base cursor-pointer transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "#fff", color: "#DC2626" }}>
                    Get Started Free
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
                <Link href="/sign-in">
                  <div className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base cursor-pointer border-2 border-white/40 text-white hover:border-white transition-all">
                    Log in
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-6 md:px-10 py-14" style={{ background: "#050505" }}>
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logoImage} alt="Autobot360 logo" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-bold text-white">Autobot360</span>
            </div>
            <p className="text-sm leading-relaxed text-white/40 max-w-xs">
              Capture decisions, connect your tools, and build a living second brain for your company.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>Product</p>
            <div className="space-y-3 text-sm text-white/40">
              <div><Link href="/analytics"><span className="hover:text-white cursor-pointer">Analytics</span></Link></div>
              <div><Link href="/integrations"><span className="hover:text-white cursor-pointer">Integrations</span></Link></div>
              <div><Link href="/billing"><span className="hover:text-white cursor-pointer">Billing</span></Link></div>
              <div><Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link></div>
              <div><Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>Company</p>
            <div className="space-y-3 text-sm text-white/40">
              <div><Link href="/dashboard"><span className="hover:text-white cursor-pointer">Dashboard</span></Link></div>
              <div><Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link></div>
              <div><Link href="/sign-in"><span className="hover:text-white cursor-pointer">Sign in</span></Link></div>
              <div><Link href="/terms"><span className="hover:text-white cursor-pointer">Terms & Conditions</span></Link></div>
              <div><Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy Policy</span></Link></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>What it does</p>
            <ul className="space-y-3 text-sm text-white/40 leading-relaxed">
              <li>• Captures from Gmail and Meet</li>
              <li>• Connects Slack, Jira, and more</li>
              <li>• Surfaces risks, patterns, and follow-ups</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Autobot360 OS. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Enterprise-grade security
          </div>
        </div>
      </footer>
    </div>
  );
}

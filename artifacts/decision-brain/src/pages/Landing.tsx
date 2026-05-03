import { Link } from "wouter";
import { BrainCircuit, Shield, Zap, Target, ChevronRight, Network } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          <span className="font-serif text-2xl font-bold tracking-tight">Decision Brain</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <span className="text-sm font-medium text-muted-foreground hover:text-white transition-colors cursor-pointer">
              Log in
            </span>
          </Link>
          <Link href="/sign-up">
            <span className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
              Get Access
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-8 md:px-16 flex flex-col items-center text-center max-w-5xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now operating in stealth
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6 leading-tight">
              The intelligence engine <br className="hidden md:block" /> for executive decisions.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Decision Brain silently captures your choices, detects patterns, tracks outcomes, and alerts you to blind spots before they become liabilities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <div className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium text-lg hover:bg-primary/90 transition-colors cursor-pointer">
                  Start Operating
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
              <div className="text-muted-foreground text-sm flex items-center gap-2 px-6 py-4">
                <Shield className="w-4 h-4" />
                Enterprise-grade security
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-8 md:px-16 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">Every choice, quantified.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Stop relying on intuition. Start building a compounding database of your executive judgment.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Silent Capture",
                  desc: "Integrates with Gmail, Slack, Zoom, and Teams to extract decisions as they happen. No manual entry required.",
                  icon: Zap,
                  color: "text-primary",
                  bg: "bg-primary/10"
                },
                {
                  title: "Pattern Detection",
                  desc: "AI identifies repeated mistakes, urgency biases, and cognitive blind spots across your entire decision history.",
                  icon: Network,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10"
                },
                {
                  title: "Outcome Tracking",
                  desc: "Automatically follows up on decisions at 30, 90, or 180 days to score the real-world outcome against intent.",
                  icon: Target,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10"
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-background border border-border flex flex-col items-start hover:border-primary/50 transition-colors">
                  <div className={`p-4 rounded-xl ${feature.bg} ${feature.color} mb-6`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 text-center border-t border-border/40">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-muted-foreground" />
          <span className="font-serif font-medium text-muted-foreground">Decision Brain</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Decision Brain OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
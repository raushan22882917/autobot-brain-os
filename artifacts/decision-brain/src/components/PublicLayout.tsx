import { Link } from "wouter";
import { ArrowRight, Shield, ChevronRight, TrendingUp } from "lucide-react";
import logoImage from "@assets/logo_1777805810138.png";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl" style={{ background: "rgba(5,5,5,0.85)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImage} alt="Autobot360 logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-xl tracking-tight text-white">Autobot360</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <Link href="/about"><span className="hover:text-white transition-colors cursor-pointer">About</span></Link>
            <Link href="/contact"><span className="hover:text-white transition-colors cursor-pointer">Contact</span></Link>
            <Link href="/product"><span className="hover:text-white transition-colors cursor-pointer">Product</span></Link>
            <Link href="/pricing"><span className="hover:text-white transition-colors cursor-pointer">Pricing</span></Link>
            <Link href="/integrations-public"><span className="hover:text-white transition-colors cursor-pointer">Integrations</span></Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in"><span className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer px-3 py-2">Log in</span></Link>
            <Link href="/sign-up"><span className="text-sm font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-all hover:opacity-90 active:scale-95" style={{ background: "#DC2626", color: "#fff" }}>Get Access</span></Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/8 px-6 md:px-10 py-14" style={{ background: "#050505" }}>
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logoImage} alt="Autobot360 logo" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-bold text-white">Autobot360</span>
            </div>
            <p className="text-sm leading-relaxed text-white/40 max-w-xs">Capture decisions, connect your tools, and build a living second brain for your company.</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>Product</p>
            <div className="space-y-3 text-sm text-white/40">
              <div><Link href="/integrations-public"><span className="hover:text-white cursor-pointer">Integrations</span></Link></div>
              <div><Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link></div>
              <div><Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#DC2626" }}>Company</p>
            <div className="space-y-3 text-sm text-white/40">
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

import { Link } from "wouter";
import logoImage from "@assets/logo_1777805810138.png";

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/integrations-public", label: "Integrations" },
];

const FOOTER_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/integrations-public", label: "Integrations" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl" style={{ background: "rgba(5,5,5,0.88)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoImage} alt="Autobot360 logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-xl tracking-tight text-white">Autobot360</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="hover:text-white transition-colors cursor-pointer">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/10 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={logoImage} alt="Autobot360 logo" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <p className="font-bold text-white">Autobot360</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Decision intelligence OS</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/50">
              {FOOTER_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className="hover:text-white transition-colors cursor-pointer">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/35">Autobot360 helps teams capture, review, and improve important decisions.</p>
        </div>
      </footer>
    </div>
  );
}

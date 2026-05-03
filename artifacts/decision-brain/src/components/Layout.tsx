import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  BrainCircuit,
  Target,
  Bell,
  Plug,
  Network,
  EyeOff,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
  CreditCard,
  GitBranch,
  Radio,
  BarChart2,
  Inbox,
  BookOpen,
  Users,
  FlameKindling,
  ScrollText,
} from "lucide-react";
import { useState } from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Command Center",
    items: [
      { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
      { href: "/chat",         label: "AI Advisor",   icon: MessageSquare },
      { href: "/alerts",       label: "Alerts",       icon: Bell, badge: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/decisions",    label: "Decisions",    icon: BrainCircuit },
      { href: "/outcomes",     label: "Outcomes",     icon: Target },
      { href: "/patterns",     label: "Patterns",     icon: Network },
      { href: "/blindspots",   label: "Blind Spots",  icon: EyeOff },
      { href: "/feed",         label: "Live Feed",    icon: Radio, live: true },
      { href: "/inbox",        label: "Decision Inbox", icon: Inbox, newBadge: true },
    ],
  },
  {
    label: "Advanced",
    items: [
      { href: "/briefing",     label: "Pre-Decision Brief", icon: ScrollText, newBadge: true },
      { href: "/advisor",      label: "Advisor Intel",      icon: Users,       newBadge: true },
      { href: "/energy",       label: "Energy Map",         icon: FlameKindling, newBadge: true },
      { href: "/legacy",       label: "Legacy Report",      icon: BookOpen,    newBadge: true },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/analytics",    label: "Analytics",    icon: BarChart2 },
      { href: "/reports",      label: "Reports",      icon: FileText },
      { href: "/pricing",      label: "Billing",      icon: CreditCard },
      { href: "/jira",         label: "Dev Tracker",  icon: GitBranch },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: alerts } = useListAlerts({ unread: true }, { query: { enabled: !!user } });
  const unreadCount = alerts?.filter((a: any) => a.isRead === false)?.length || 0;

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#050505" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b shrink-0" style={{ borderColor: "#161616" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
          <BrainCircuit className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          <div className="absolute inset-0 rounded-xl" style={{ boxShadow: "0 0 20px rgba(220,38,38,0.4)" }} />
        </div>
        <div>
          <p className="font-bold text-white text-[13px] leading-tight tracking-wide">Decision Brain</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="w-2.5 h-2.5" style={{ color: "#DC2626" }} />
            <p className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#DC2626" }}>Intelligence OS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label}>
            <p className={cn(
              "text-[9px] font-bold tracking-[0.2em] uppercase px-3 mb-1",
              si > 0 ? "pt-3" : "pt-1"
            )} style={{ color: "#383838" }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group relative",
                      isActive ? "text-white" : "text-white/35 hover:text-white/70"
                    )}
                      style={isActive ? {
                        background: "linear-gradient(90deg, rgba(220,38,38,0.15), rgba(220,38,38,0.04))",
                        boxShadow: "inset 1px 0 0 #DC2626",
                      } : {}}
                    >
                      <item.icon className={cn(
                        "w-[15px] h-[15px] shrink-0 transition-colors",
                        isActive ? "text-red-500" : "text-white/25 group-hover:text-white/60"
                      )} />
                      <span className={cn("font-medium text-[13px] flex-1", isActive ? "text-white" : "")}>{item.label}</span>
                      {(item as any).badge && unreadCount > 0 && (
                        <span className="text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 text-white"
                          style={{ background: "#DC2626", boxShadow: "0 0 8px rgba(220,38,38,0.6)" }}>
                          {unreadCount}
                        </span>
                      )}
                      {(item as any).newBadge && !isActive && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                          style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                          New
                        </span>
                      )}
                      {(item as any).live && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                      )}
                      {isActive && <ChevronRight className="w-3 h-3 text-red-500/50" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 space-y-2 border-t pt-3" style={{ borderColor: "#161616" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#0f0f0f" }}>
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2" style={{ ringColor: "#DC2626" }}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#DC2626" }}>
                {user?.firstName?.[0] || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{user?.fullName || "Executive"}</p>
            <p className="text-[10px] truncate" style={{ color: "#444" }}>{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Link href="/settings" onClick={() => setIsMobileOpen(false)} className="flex-1">
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/40 hover:text-white text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/5">
              <Settings className="w-3 h-3" />
              Settings
            </div>
          </Link>
          <button onClick={handleSignOut} className="flex items-center justify-center py-2 px-3 rounded-lg text-white/30 hover:text-red-400 transition-colors hover:bg-red-500/10">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  const currentPage = NAV_SECTIONS.flatMap(s => s.items).find(
    i => location === i.href || location.startsWith(`${i.href}/`)
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row" style={{ background: "#080808" }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b shrink-0" style={{ background: "#050505", borderColor: "#161616" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#DC2626" }}>
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Decision Brain</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white/50 hover:text-white p-1.5 transition-colors">
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 backdrop-blur-sm md:hidden" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 md:z-auto md:static md:w-56 md:flex flex-col transition-transform duration-300 border-r shrink-0",
        isMobileOpen ? "flex translate-x-0" : "-translate-x-full md:translate-x-0"
      )} style={{ borderColor: "#161616" }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top header */}
        <div className="hidden md:flex items-center justify-between px-8 h-14 border-b shrink-0" style={{ background: "#050505", borderColor: "#161616" }}>
          <div className="flex items-center gap-2 text-[13px]">
            <span style={{ color: "#333" }}>Decision Brain</span>
            <ChevronRight className="w-3 h-3" style={{ color: "#222" }} />
            <span className="text-white font-medium">{currentPage?.label || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#333" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
              Live · {dateStr}
            </div>
            <Link href="/chat">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-colors cursor-pointer"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <MessageSquare className="w-3 h-3 text-red-500" />
                Ask AI
              </div>
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  BrainCircuit,
  Target,
  Bell,
  Link as LinkIcon,
  Network,
  EyeOff,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/decisions",    label: "Decisions",   icon: BrainCircuit },
  { href: "/outcomes",     label: "Outcomes",    icon: Target },
  { href: "/alerts",       label: "Alerts",      icon: Bell },
  { href: "/integrations", label: "Integrations",icon: LinkIcon },
  { href: "/patterns",     label: "Patterns",    icon: Network },
  { href: "/blindspots",   label: "Blind Spots", icon: EyeOff },
  { href: "/reports",      label: "Reports",     icon: FileText },
  { href: "/chat",         label: "AI Chat",     icon: MessageSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: alerts } = useListAlerts({ unread: true }, { query: { enabled: !!user } });
  const unreadAlertCount = alerts?.filter(a => a.isRead === false)?.length || 0;

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#080808" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "#1a1a1a" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#DC2626" }}>
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight tracking-wide">Decision Brain</p>
          <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#DC2626" }}>OS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative",
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/80 hover:bg-white/4"
              )}
                style={isActive ? { background: "rgba(220,38,38,0.12)", color: "#fff" } : {}}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: "#DC2626" }} />
                )}
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-red-500" : "text-white/35 group-hover:text-white/70")} />
                <span className="font-medium text-sm flex-1">{item.label}</span>
                {item.href === "/alerts" && unreadAlertCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#DC2626" }}>
                    {unreadAlertCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-500/60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t" style={{ borderColor: "#1a1a1a" }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 shrink-0"
            style={{ borderColor: "#DC2626" }}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#DC2626" }}>
                {user?.firstName?.[0] || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName || "User"}</p>
            <p className="text-xs truncate" style={{ color: "#555" }}>{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/settings" onClick={() => setIsMobileOpen(false)} className="flex-1">
            <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <Settings className="w-3.5 h-3.5" />
              Settings
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center py-2 px-3 rounded-lg text-white/40 hover:text-red-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b" style={{ background: "#080808", borderColor: "#1a1a1a" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#DC2626" }}>
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Decision Brain</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white/60 hover:text-white p-1.5 transition-colors">
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 md:z-auto md:static md:w-60 md:flex flex-col transition-transform duration-300 border-r",
        isMobileOpen ? "flex translate-x-0" : "-translate-x-full md:translate-x-0"
      )} style={{ borderColor: "#1a1a1a" }}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

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
  X
} from "lucide-react";
import { useState } from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/decisions", label: "Decisions", icon: BrainCircuit },
  { href: "/outcomes", label: "Outcomes", icon: Target },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/integrations", label: "Integrations", icon: LinkIcon },
  { href: "/patterns", label: "Patterns", icon: Network },
  { href: "/blindspots", label: "Blind Spots", icon: EyeOff },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const { data: alerts } = useListAlerts({ unread: true }, { query: { enabled: !!user } });
  const unreadAlertCount = alerts?.filter(a => a.isRead === false)?.length || 0;

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <span className="font-serif text-lg text-white">Decision Brain</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white p-2">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 md:z-auto md:static md:w-64 md:flex flex-col bg-card border-r border-border transition-transform transform md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-border">
          <BrainCircuit className="w-8 h-8 text-primary" />
          <span className="font-serif text-xl text-white tracking-wide">Decision Brain</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors group",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.href === "/alerts" && unreadAlertCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadAlertCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold">{user?.firstName?.[0] || 'U'}</span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.fullName || 'User'}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href="/settings" onClick={() => setIsMobileOpen(false)}>
              <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-md text-white text-sm font-medium transition-colors cursor-pointer">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </Link>
            <button onClick={handleSignOut} className="flex items-center justify-center py-2 px-3 bg-white/5 hover:bg-destructive/20 hover:text-destructive text-muted-foreground rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
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
import { useState } from "react";
import { useUser } from "@clerk/react";
import {
  Users, CreditCard, Activity, Settings2, Shield, Search, ChevronDown,
  TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, Zap, BarChart2,
  Download, MoreHorizontal, UserCheck, UserX, RefreshCw, Mail,
  Crown, Lock, Unlock, Eye, Trash2, Ban, Star, ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = ["admin@autobot360.com", "founder@autobot360.com"];

type Plan = "free" | "pro" | "enterprise";
type Status = "active" | "suspended" | "churned" | "trial";

interface MockUser {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  status: Status;
  joined: string;
  lastActive: string;
  decisionsCount: number;
  integrationsCount: number;
  mrr: number;
  usage: number;
}

const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Sarah Chen", email: "sarah@acmecorp.com", plan: "enterprise", status: "active", joined: "2024-01-15", lastActive: "2 min ago", decisionsCount: 847, integrationsCount: 6, mrr: 499, usage: 92 },
  { id: "u2", name: "Marcus Williams", email: "m.williams@nexus.io", plan: "pro", status: "active", joined: "2024-02-20", lastActive: "1 hour ago", decisionsCount: 312, integrationsCount: 4, mrr: 99, usage: 67 },
  { id: "u3", name: "Priya Nair", email: "priya@globalventures.com", plan: "enterprise", status: "active", joined: "2023-11-01", lastActive: "3 hours ago", decisionsCount: 1204, integrationsCount: 8, mrr: 999, usage: 88 },
  { id: "u4", name: "James Okafor", email: "james@startupxyz.com", plan: "pro", status: "trial", joined: "2024-05-01", lastActive: "Yesterday", decisionsCount: 45, integrationsCount: 2, mrr: 0, usage: 31 },
  { id: "u5", name: "Emily Zhao", email: "e.zhao@deeptech.ai", plan: "free", status: "active", joined: "2024-03-10", lastActive: "2 days ago", decisionsCount: 18, integrationsCount: 1, mrr: 0, usage: 14 },
  { id: "u6", name: "David Rosenstein", email: "david@capitalfund.com", plan: "enterprise", status: "active", joined: "2023-09-15", lastActive: "5 min ago", decisionsCount: 2103, integrationsCount: 8, mrr: 999, usage: 97 },
  { id: "u7", name: "Amara Diallo", email: "amara@consultingco.com", plan: "pro", status: "suspended", joined: "2024-01-05", lastActive: "2 weeks ago", decisionsCount: 156, integrationsCount: 3, mrr: 0, usage: 0 },
  { id: "u8", name: "Kenji Tanaka", email: "k.tanaka@japan-tech.jp", plan: "pro", status: "churned", joined: "2023-12-01", lastActive: "1 month ago", decisionsCount: 89, integrationsCount: 2, mrr: 0, usage: 0 },
];

const PLAN_COLORS: Record<Plan, string> = {
  free: "text-white/50 border-white/15 bg-white/5",
  pro: "text-blue-400 border-blue-400/25 bg-blue-400/8",
  enterprise: "text-yellow-400 border-yellow-400/25 bg-yellow-400/8",
};

const STATUS_COLORS: Record<Status, string> = {
  active: "text-emerald-400 border-emerald-400/25 bg-emerald-400/8",
  trial: "text-purple-400 border-purple-400/25 bg-purple-400/8",
  suspended: "text-orange-400 border-orange-400/25 bg-orange-400/8",
  churned: "text-red-400 border-red-400/25 bg-red-400/8",
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 p-5" style={{ background: "#0a0a0a" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color ? `${color}15` : "rgba(220,38,38,0.1)", border: `1px solid ${color ? `${color}25` : "rgba(220,38,38,0.2)"}` }}>
          <Icon className="w-4 h-4" style={{ color: color || "#DC2626" }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/40 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-emerald-500 mt-1">{sub}</p>}
    </div>
  );
}

function UserActionMenu({ user, onAction }: { user: MockUser; onAction: (action: string, user: MockUser) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 transition-colors text-white/30 hover:text-white/70"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-white/10 overflow-hidden shadow-2xl" style={{ background: "#111" }}>
            {[
              { icon: Eye, label: "View Profile", action: "view" },
              { icon: Mail, label: "Send Email", action: "email" },
              { icon: Crown, label: "Upgrade Plan", action: "upgrade" },
              { icon: RefreshCw, label: "Reset Password", action: "reset" },
              user.status === "suspended"
                ? { icon: Unlock, label: "Unsuspend", action: "unsuspend" }
                : { icon: Ban, label: "Suspend", action: "suspend" },
              { icon: Trash2, label: "Delete User", action: "delete" },
            ].map(item => (
              <button
                key={item.action}
                onClick={() => { onAction(item.action, user); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium hover:bg-white/5 transition-colors text-left ${
                  item.action === "delete" ? "text-red-400" : "text-white/60"
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlanChangeModal({ user, onClose, onSave }: { user: MockUser; onClose: () => void; onSave: (plan: Plan) => void }) {
  const [selected, setSelected] = useState<Plan>(user.plan);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl" style={{ background: "#0d0d0d" }}>
        <h3 className="text-lg font-bold text-white mb-1">Change Plan</h3>
        <p className="text-sm text-white/40 mb-5">{user.name} · {user.email}</p>
        <div className="space-y-2 mb-6">
          {(["free", "pro", "enterprise"] as Plan[]).map(plan => (
            <button
              key={plan}
              onClick={() => setSelected(plan)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                selected === plan ? "border-white/20 bg-white/5" : "border-white/8 hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-2">
                {plan === "enterprise" && <Crown className="w-4 h-4 text-yellow-400" />}
                {plan === "pro" && <Zap className="w-4 h-4 text-blue-400" />}
                {plan === "free" && <Star className="w-4 h-4 text-white/30" />}
                <span className="text-sm font-medium text-white capitalize">{plan}</span>
              </div>
              <span className="text-xs text-white/40">
                {plan === "free" ? "$0/mo" : plan === "pro" ? "$99/mo" : "$499+/mo"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-white/10 text-white/60 hover:text-white" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { onSave(selected); onClose(); }}>Save Change</Button>
        </div>
      </div>
    </div>
  );
}

type AdminTab = "overview" | "users" | "subscriptions" | "activity";

export default function Admin() {
  const { user } = useUser();
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<Plan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [planModalUser, setPlanModalUser] = useState<MockUser | null>(null);

  const isAdmin = ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress || "");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Admin Access Required</h2>
        <p className="text-white/40 max-w-xs">This panel is restricted to Autobot360 administrators only.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalMRR = users.filter(u => u.status === "active").reduce((s, u) => s + u.mrr, 0);
  const activeUsers = users.filter(u => u.status === "active").length;
  const trialUsers = users.filter(u => u.status === "trial").length;
  const enterpriseUsers = users.filter(u => u.plan === "enterprise").length;

  const handleAction = (action: string, u: MockUser) => {
    if (action === "upgrade") { setPlanModalUser(u); return; }
    if (action === "suspend") {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, status: "suspended" as Status, mrr: 0 } : p));
      toast({ title: "User suspended", description: `${u.name} has been suspended.` });
    } else if (action === "unsuspend") {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, status: "active" as Status } : p));
      toast({ title: "User unsuspended", description: `${u.name} has been reinstated.` });
    } else if (action === "delete") {
      setUsers(prev => prev.filter(p => p.id !== u.id));
      toast({ title: "User deleted", description: `${u.name} has been removed.`, variant: "destructive" });
    } else {
      toast({ title: `${action} triggered`, description: `Action performed for ${u.name}.` });
    }
  };

  const handlePlanChange = (newPlan: Plan) => {
    if (!planModalUser) return;
    const mrr = newPlan === "free" ? 0 : newPlan === "pro" ? 99 : 499;
    setUsers(prev => prev.map(p => p.id === planModalUser.id ? { ...p, plan: newPlan, mrr } : p));
    toast({ title: "Plan updated", description: `${planModalUser.name} moved to ${newPlan} plan.` });
    setPlanModalUser(null);
  };

  const TABS: { key: AdminTab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart2 },
    { key: "users", label: "Users", icon: Users },
    { key: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { key: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {planModalUser && (
        <PlanChangeModal
          user={planModalUser}
          onClose={() => setPlanModalUser(null)}
          onSave={handlePlanChange}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5" style={{ color: "#DC2626" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#DC2626" }}>Admin Panel</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage users, subscriptions, and platform health.</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 w-fit" style={{ background: "#0a0a0a" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            style={tab === t.key ? { background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.25)" } : {}}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="Monthly Recurring Revenue" value={`$${totalMRR.toLocaleString()}`} sub="+12% vs last month" color="#22c55e" />
            <StatCard icon={Users} label="Active Users" value={activeUsers} sub={`${trialUsers} on trial`} color="#60a5fa" />
            <StatCard icon={Crown} label="Enterprise Accounts" value={enterpriseUsers} sub={`${Math.round(enterpriseUsers / users.length * 100)}% of user base`} color="#facc15" />
            <StatCard icon={Activity} label="Total Decisions Captured" value={users.reduce((s, u) => s + u.decisionsCount, 0).toLocaleString()} sub="All time" color="#a78bfa" />
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-2xl border border-white/8 p-6" style={{ background: "#0a0a0a" }}>
            <h3 className="text-base font-bold text-white mb-5">Revenue by Plan</h3>
            <div className="space-y-4">
              {(["enterprise", "pro", "free"] as Plan[]).map(plan => {
                const planUsers = users.filter(u => u.plan === plan && u.status === "active");
                const planMrr = planUsers.reduce((s, u) => s + u.mrr, 0);
                const pct = totalMRR > 0 ? Math.round(planMrr / totalMRR * 100) : 0;
                return (
                  <div key={plan} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium text-white/70">{plan}</span>
                      <span className="font-bold text-white">${planMrr.toLocaleString()}/mo · {planUsers.length} users</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#161616" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: plan === "enterprise" ? "#facc15" : plan === "pro" ? "#60a5fa" : "#3f3f3f"
                        }} />
                    </div>
                    <p className="text-[10px] text-white/25">{pct}% of total MRR</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent signups */}
          <div className="rounded-2xl border border-white/8 p-6" style={{ background: "#0a0a0a" }}>
            <h3 className="text-base font-bold text-white mb-4">Recent Signups</h3>
            <div className="space-y-3">
              {[...users].sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime()).slice(0, 4).map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "rgba(220,38,38,0.15)" }}>
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-white/35 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[10px] border", PLAN_COLORS[u.plan])}>{u.plan}</Badge>
                    <span className="text-[11px] text-white/30">{u.joined}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder-white/25"
              />
            </div>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm border border-white/10 text-white/70 outline-none"
              style={{ background: "#0a0a0a" }}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm border border-white/10 text-white/70 outline-none"
              style={{ background: "#0a0a0a" }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          {/* User table */}
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#0a0a0a" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["User", "Plan", "Status", "Decisions", "Integrations", "MRR", "Last Active", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className={cn(
                      "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                      i === filteredUsers.length - 1 && "border-0"
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "rgba(220,38,38,0.15)" }}>
                            {u.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-[13px] leading-tight truncate max-w-[140px]">{u.name}</p>
                            <p className="text-[11px] text-white/30 truncate max-w-[140px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border capitalize", PLAN_COLORS[u.plan])}>{u.plan}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border capitalize", STATUS_COLORS[u.status])}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-[13px]">{u.decisionsCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-white/60 text-[13px]">{u.integrationsCount}/8</td>
                      <td className="px-4 py-3 font-medium text-[13px]">
                        <span className={u.mrr > 0 ? "text-emerald-400" : "text-white/25"}>
                          {u.mrr > 0 ? `$${u.mrr}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/35 text-[12px] whitespace-nowrap">{u.lastActive}</td>
                      <td className="px-4 py-3">
                        <UserActionMenu user={u} onAction={handleAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-white/25 text-sm">No users match your filters.</div>
            )}
          </div>
          <p className="text-[11px] text-white/25">{filteredUsers.length} of {users.length} users shown</p>
        </div>
      )}

      {/* Subscriptions Tab */}
      {tab === "subscriptions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["enterprise", "pro", "free"] as Plan[]).map(plan => {
              const planUsers = users.filter(u => u.plan === plan);
              const active = planUsers.filter(u => u.status === "active").length;
              const planMrr = planUsers.reduce((s, u) => s + u.mrr, 0);
              return (
                <div key={plan} className="rounded-2xl border border-white/8 p-5" style={{ background: "#0a0a0a" }}>
                  <div className="flex items-center gap-2 mb-4">
                    {plan === "enterprise" && <Crown className="w-5 h-5 text-yellow-400" />}
                    {plan === "pro" && <Zap className="w-5 h-5 text-blue-400" />}
                    {plan === "free" && <Star className="w-5 h-5 text-white/30" />}
                    <span className="font-bold text-white capitalize">{plan}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{planUsers.length}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{active} active users</p>
                  <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
                    <span className="text-xs text-white/40">MRR</span>
                    <span className="font-bold text-emerald-400">${planMrr.toLocaleString()}</span>
                  </div>
                  {plan === "pro" && (
                    <div className="text-[11px] text-white/25 mt-1">$99/mo per seat</div>
                  )}
                  {plan === "enterprise" && (
                    <div className="text-[11px] text-white/25 mt-1">$499–999+/mo</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subscription table */}
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#0a0a0a" }}>
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">All Subscriptions</h3>
              <span className="text-[11px] text-white/30">{users.filter(u => u.mrr > 0).length} paid accounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Account", "Plan", "MRR", "Status", "Joined", "Usage", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.mrr - a.mrr).map((u, i) => (
                    <tr key={u.id} className={cn("border-b border-white/5 hover:bg-white/[0.02]", i === users.length - 1 && "border-0")}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white text-[13px]">{u.name}</p>
                          <p className="text-[11px] text-white/30">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border capitalize", PLAN_COLORS[u.plan])}>{u.plan}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-bold text-[13px]", u.mrr > 0 ? "text-emerald-400" : "text-white/20")}>
                          {u.mrr > 0 ? `$${u.mrr}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border capitalize", STATUS_COLORS[u.status])}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-white/35 text-[12px]">{u.joined}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${u.usage}%`,
                              background: u.usage > 85 ? "#DC2626" : u.usage > 60 ? "#f59e0b" : "#22c55e"
                            }} />
                          </div>
                          <span className="text-[11px] text-white/35">{u.usage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPlanModalUser(u)}
                          className="text-[11px] font-medium text-white/40 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                        >
                          Change Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#0a0a0a" }}>
            <div className="px-5 py-4 border-b border-white/8">
              <h3 className="font-bold text-white text-sm">Recent Activity Log</h3>
              <p className="text-[11px] text-white/30 mt-0.5">All admin and system actions across the platform</p>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { icon: UserCheck, color: "#22c55e", text: "Sarah Chen connected Gmail integration", time: "2 min ago", user: "sarah@acmecorp.com" },
                { icon: CreditCard, color: "#facc15", text: "David Rosenstein upgraded to Enterprise", time: "18 min ago", user: "david@capitalfund.com" },
                { icon: UserX, color: "#f87171", text: "Amara Diallo account suspended by admin", time: "2 hours ago", user: "admin@autobot360.com" },
                { icon: Users, color: "#60a5fa", text: "James Okafor signed up (Trial)", time: "3 hours ago", user: "james@startupxyz.com" },
                { icon: RefreshCw, color: "#a78bfa", text: "Priya Nair synced Notion integration", time: "5 hours ago", user: "priya@globalventures.com" },
                { icon: AlertCircle, color: "#f59e0b", text: "Failed sync attempt for Zoom integration", time: "6 hours ago", user: "m.williams@nexus.io" },
                { icon: CheckCircle2, color: "#22c55e", text: "Emily Zhao completed onboarding", time: "1 day ago", user: "e.zhao@deeptech.ai" },
                { icon: CreditCard, color: "#f87171", text: "Kenji Tanaka subscription cancelled", time: "1 month ago", user: "k.tanaka@japan-tech.jp" },
              ].map((event, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${event.color}15`, border: `1px solid ${event.color}25` }}>
                    <event.icon className="w-4 h-4" style={{ color: event.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70">{event.text}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{event.user}</p>
                  </div>
                  <span className="text-[11px] text-white/25 shrink-0">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

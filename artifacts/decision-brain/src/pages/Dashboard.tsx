import { useGetAnalyticsOverview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  BrainCircuit, AlertTriangle, Target, Activity, TrendingUp,
  TrendingDown, ChevronRight, Zap, Shield, Clock, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";

const RED   = "#DC2626";
const RED_D = "#991b1b";

const STAKES_COLORS: Record<string, string> = {
  low:      "#333",
  medium:   "#555",
  high:     "#b45309",
  critical: "#DC2626",
};

function StatCard({
  label, value, sub, icon: Icon, trend, trendUp, accent = RED, glow = false,
}: {
  label: string; value: string | number; sub: string;
  icon: any; trend?: string; trendUp?: boolean; accent?: string; glow?: boolean;
}) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden flex flex-col gap-3 border transition-all"
      style={{
        background: glow ? "rgba(220,38,38,0.05)" : "#0d0d0d",
        borderColor: glow ? "rgba(220,38,38,0.25)" : "#1a1a1a",
      }}>
      {glow && (
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.2), transparent 70%)" }} />
      )}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#333" }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: glow ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-bold leading-none tracking-tight"
          style={{ color: glow ? "#f87171" : "#fff" }}>
          {value}
        </p>
      </div>
      <div className="flex items-center justify-between relative z-10">
        <p className="text-xs" style={{ color: "#3a3a3a" }}>{sub}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full`}
            style={{
              background: trendUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: trendUp ? "#22c55e" : "#ef4444",
            }}>
            {trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-sm shadow-2xl"
      style={{ background: "#0a0a0a", borderColor: "#222" }}>
      {label && <p className="text-[11px] mb-1.5 font-medium" style={{ color: "#555" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold text-lg" style={{ color: p.color || RED }}>
          {p.value}
          <span className="text-xs font-normal ml-1" style={{ color: "#555" }}>decisions</span>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetAnalyticsOverview();
  const { user } = useUser();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName || "Executive";

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-28 w-full rounded-2xl" style={{ background: "#111" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" style={{ background: "#111" }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Skeleton className="h-72 lg:col-span-3 rounded-2xl" style={{ background: "#111" }} />
          <Skeleton className="h-72 lg:col-span-2 rounded-2xl" style={{ background: "#111" }} />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const avgOutcomeScore = analytics.avgOutcomeScore ?? 0;
  const unreadAlerts = analytics.unreadAlerts ?? 0;
  const totalDecisions = analytics.totalDecisions ?? 0;
  const decisionsThisMonth = analytics.decisionsThisMonth ?? 0;
  const pendingOutcomes = analytics.pendingOutcomes ?? 0;
  const decisionsByStakes = (analytics.decisionsByStakes && typeof analytics.decisionsByStakes === 'object')
    ? analytics.decisionsByStakes as Record<string, number>
    : {} as Record<string, number>;

  const stakesData = Object.entries(decisionsByStakes)
    .map(([name, value]) => ({ name, value: value ?? 0 }))
    .filter(d => d.value > 0);

  const healthScore = Math.min(100, Math.max(0, Math.round(
    (avgOutcomeScore * 0.6) +
    (Math.max(0, 100 - unreadAlerts * 10) * 0.4)
  )));

  const healthColor = healthScore >= 70 ? "#22c55e" : healthScore >= 45 ? "#f59e0b" : "#DC2626";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Hero welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 border"
        style={{
          background: "linear-gradient(135deg, #0d0d0d, #110505)",
          borderColor: "rgba(220,38,38,0.15)",
        }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96"
            style={{ background: "radial-gradient(circle at 100% 0%, rgba(220,38,38,0.08), transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64"
            style={{ background: "radial-gradient(circle at 0% 100%, rgba(220,38,38,0.04), transparent 70%)" }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "#444" }}>{greeting}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">{firstName}</h1>
            <p className="mt-2 text-sm max-w-md" style={{ color: "#3a3a3a" }}>
              Your decision intelligence is live. Here's what requires your attention today.
            </p>
          </div>

          {/* Decision Health Score */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#333" }}>Decision Health</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
                <span className="text-lg font-medium" style={{ color: "#333" }}>/100</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                <div className="w-2 h-2 rounded-full" style={{ background: healthColor }} />
                <p className="text-xs font-semibold" style={{ color: healthColor }}>
                  {healthScore >= 70 ? "Strong" : healthScore >= 45 ? "Moderate" : "Needs Attention"}
                </p>
              </div>
            </div>

            {unreadAlerts > 0 && (
              <Link href="/alerts">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-all hover:scale-105"
                  style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
                  <div>
                    <p className="text-xl font-bold" style={{ color: "#f87171" }}>{unreadAlerts}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#DC2626" }}>Alert{unreadAlerts > 1 ? "s" : ""}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Decisions"
          value={totalDecisions}
          sub={`${decisionsThisMonth} logged this month`}
          icon={BrainCircuit}
          trend={`+${decisionsThisMonth}`}
          trendUp={true}
        />
        <StatCard
          label="Avg Outcome Score"
          value={`${avgOutcomeScore.toFixed(0)}`}
          sub="Out of 100 possible"
          icon={TrendingUp}
          accent="#a3a3a3"
          trend={avgOutcomeScore >= 60 ? "Above avg" : "Below avg"}
          trendUp={avgOutcomeScore >= 60}
        />
        <StatCard
          label="Active Alerts"
          value={unreadAlerts}
          sub="Blind spots & patterns"
          icon={AlertTriangle}
          glow={unreadAlerts > 0}
          trend={unreadAlerts > 0 ? "Action needed" : "All clear"}
          trendUp={unreadAlerts === 0}
        />
        <StatCard
          label="Pending Review"
          value={pendingOutcomes}
          sub="Outcomes awaiting input"
          icon={Activity}
          accent="#a3a3a3"
        />
      </div>

      {/* Charts + Stakes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Decision Velocity */}
        <div className="lg:col-span-3 rounded-2xl border p-6" style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Decision Velocity</h3>
              <p className="text-xs mt-0.5" style={{ color: "#333" }}>Volume of decisions logged over time</p>
            </div>
            <div className="px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.15)" }}>
              Last 12 months
            </div>
          </div>
          <div className="h-[220px]">
            {analytics.decisionVelocity && analytics.decisionVelocity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.decisionVelocity} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={RED} stopOpacity={0.25} />
                      <stop offset="85%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#151515" vertical={false} />
                  <XAxis dataKey="date" stroke="#1c1c1c" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#303030" }} />
                  <YAxis stroke="#1c1c1c" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#303030" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke={RED} strokeWidth={2.5} fill="url(#redGrad)"
                    dot={false} activeDot={{ r: 5, fill: RED, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <Activity className="w-8 h-8" style={{ color: "#222" }} />
                <p className="text-sm" style={{ color: "#333" }}>No velocity data yet</p>
                <p className="text-xs" style={{ color: "#222" }}>Log decisions or sync your accounts to begin tracking</p>
              </div>
            )}
          </div>
        </div>

        {/* Stakes Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col" style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}>
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Risk Portfolio</h3>
            <p className="text-xs mt-0.5" style={{ color: "#333" }}>Stakes distribution across decisions</p>
          </div>

          {stakesData.length > 0 ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stakesData} cx="50%" cy="50%" innerRadius={48} outerRadius={66}
                      paddingAngle={3} dataKey="value" stroke="none" startAngle={90} endAngle={450}>
                      {stakesData.map((entry, i) => (
                        <Cell key={i} fill={STAKES_COLORS[entry.name] || RED} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10 }} itemStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {stakesData.map((entry) => {
                  const pct = totalDecisions ? Math.round((entry.value / totalDecisions) * 100) : 0;
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STAKES_COLORS[entry.name] || RED }} />
                          <span className="capitalize text-xs font-medium" style={{ color: "#666" }}>{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs tabular-nums">{entry.value}</span>
                          <span className="text-[10px] tabular-nums" style={{ color: "#333" }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full w-full overflow-hidden" style={{ background: "#151515" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: STAKES_COLORS[entry.name] || RED }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Shield className="w-8 h-8" style={{ color: "#1a1a1a" }} />
              <p className="text-xs text-center" style={{ color: "#333" }}>No decisions logged yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: quick stats + action tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "High Stakes",
            value: decisionsByStakes?.high ?? 0,
            desc: "Significant consequence decisions",
            color: "#b45309",
            icon: AlertTriangle,
            href: "/decisions",
          },
          {
            label: "Critical",
            value: decisionsByStakes?.critical ?? 0,
            desc: "Irreversible or existential decisions",
            color: RED,
            icon: Zap,
            href: "/decisions",
          },
          {
            label: "Reviewed",
            value: totalDecisions - pendingOutcomes,
            desc: "Decisions with outcome tracking",
            color: "#22c55e",
            icon: Target,
            href: "/outcomes",
          },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="group rounded-2xl border p-5 cursor-pointer transition-all hover:border-white/10"
              style={{ background: "#0a0a0a", borderColor: "#161616" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: "#333" }} />
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[11px] font-bold text-white mb-0.5">{item.label}</p>
              <p className="text-[10px]" style={{ color: "#2a2a2a" }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick action row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Log a Decision",     href: "/decisions",    desc: "Manual entry",       color: RED },
          { label: "View Alerts",        href: "/alerts",       desc: `${unreadAlerts} unread`, color: "#f59e0b" },
          { label: "Ask AI Advisor",     href: "/chat",         desc: "Get recommendations", color: "#a78bfa" },
          { label: "Sync Accounts",      href: "/integrations", desc: "Gmail & Meet",        color: "#22c55e" },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="group flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all hover:border-white/10"
              style={{ background: "#0a0a0a", borderColor: "#161616" }}>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">{action.label}</p>
                <p className="text-[10px]" style={{ color: "#333" }}>{action.desc}</p>
              </div>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${action.color}15` }}>
                <ChevronRight className="w-3 h-3" style={{ color: action.color }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BarChart2,
  TrendingUp,
  Target,
  Bell,
  BrainCircuit,
  Layers,
  Zap,
  RefreshCw,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiUrl";

type Overview = {
  totalDecisions: number;
  decisionsThisMonth: number;
  decisionsThisWeek: number;
  avgOutcomeScore: number;
  unreadAlerts: number;
  pendingOutcomes: number;
  decisionsByStakes: Record<string, number>;
  decisionsByPlatform: Record<string, number>;
  decisionVelocity: { date: string; value: number }[];
  outcomeScoreTrend: { date: string; value: number }[];
};

type OutcomeAnalytics = {
  winRate: number;
  avgScore: number;
  scoreByStakes: Record<string, number>;
  scoreByPlatform: Record<string, number>;
};

const STAKES_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
};

const PLATFORM_ICONS: Record<string, string> = {
  gmail:   "📧",
  meet:    "🎥",
  zoom:    "💻",
  slack:   "💬",
  teams:   "👥",
  notion:  "📝",
  outlook: "📨",
  manual:  "✏️",
};

function MiniBarChart({ data, color = "#DC2626" }: { data: { value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-12 w-full">
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, 4);
        const isLast4 = i >= data.length - 4;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm min-w-[4px] transition-all"
            style={{
              height: `${pct}%`,
              background: isLast4 ? color : `${color}40`,
            }}
          />
        );
      })}
    </div>
  );
}

function ProgressRow({ label, value, max, color, percent }: { label: string; value: number; max: number; color: string; percent?: number }) {
  const pct = percent !== undefined ? percent : Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 shrink-0" style={{ color: "#888" }}>{label}</span>
      <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm w-8 text-right font-medium text-white">{value}</span>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [ovRes, outRes] = await Promise.all([
        fetch(apiUrl("/analytics/overview"), { credentials: "include" }),
        fetch(apiUrl("/analytics/outcomes"), { credentials: "include" }),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json() as Overview);
      if (outRes.ok) setOutcomes(await outRes.json() as OutcomeAnalytics);
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 bg-white/5" />)}
        </div>
      </div>
    );
  }

  const stakesCounts = overview?.decisionsByStakes ?? {};
  const platformCounts = overview?.decisionsByPlatform ?? {};
  const totalByStakes = Object.values(stakesCounts).reduce((a, b) => a + b, 0) || 1;
  const totalByPlatform = Object.values(platformCounts).reduce((a, b) => a + b, 0) || 1;
  const velocity = overview?.decisionVelocity ?? [];
  const scoreTrend = overview?.outcomeScoreTrend ?? [];

  const STAT_CARDS = [
    {
      label: "Total Decisions",
      value: overview?.totalDecisions ?? 0,
      sub: `+${overview?.decisionsThisWeek ?? 0} this week`,
      subUp: true,
      icon: BrainCircuit,
      color: "#DC2626",
    },
    {
      label: "Outcome Score",
      value: `${overview?.avgOutcomeScore ?? 0}%`,
      sub: "average across all logged",
      icon: Target,
      color: "#22c55e",
    },
    {
      label: "Unread Alerts",
      value: overview?.unreadAlerts ?? 0,
      sub: "need your attention",
      subUp: false,
      icon: Bell,
      color: "#f97316",
    },
    {
      label: "Pending Reviews",
      value: overview?.pendingOutcomes ?? 0,
      sub: "outcomes to score",
      icon: Layers,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            Full picture of your decision intelligence — velocity, outcomes, patterns, and platform coverage.
          </p>
        </div>
        <Button variant="outline" size="sm"
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5"
          onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm" style={{ color: "#555" }}>{s.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-4xl font-black text-white">{s.value}</p>
                {s.sub && (
                  <p className="text-[11px] mt-1" style={{ color: s.subUp === false ? "#ef4444" : s.subUp === true ? "#22c55e" : "#555" }}>
                    {s.sub}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Decision Velocity */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4" style={{ color: "#DC2626" }} />
                Decision Velocity
              </CardTitle>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5" style={{ borderColor: "#1a1a1a", color: "#555" }}>
                Last 8 weeks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniBarChart data={velocity.length > 0 ? velocity : Array(8).fill({ value: 0 })} color="#DC2626" />
            <p className="text-[11px]" style={{ color: "#444" }}>
              {velocity.length > 0
                ? `Week 5–8 showing ${velocity.slice(-4).reduce((s, v) => s + v.value, 0)} decisions captured`
                : "No decisions logged yet — start by logging your first decision"}
            </p>
            <div className="h-px" style={{ background: "#111" }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#333" }}>Platform Capture Split</p>
              <div className="space-y-2.5">
                {Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([platform, count]) => (
                  <ProgressRow
                    key={platform}
                    label={`${PLATFORM_ICONS[platform] ?? "•"} ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
                    value={count}
                    max={totalByPlatform}
                    percent={Math.round((count / totalByPlatform) * 100)}
                    color="#DC2626"
                  />
                ))}
                {Object.keys(platformCounts).length === 0 && (
                  <p className="text-sm" style={{ color: "#333" }}>No platform data yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Score Trend */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#22c55e" }} />
                Outcome Score Trend
              </CardTitle>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5" style={{ borderColor: "#1a1a1a", color: "#555" }}>
                Last 8 weeks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniBarChart data={scoreTrend.length > 0 ? scoreTrend : Array(8).fill({ value: 0 })} color="#22c55e" />
            <p className="text-[11px]" style={{ color: "#444" }}>
              Current average outcome score: <span className="text-white font-semibold">{overview?.avgOutcomeScore ?? 0}%</span>
            </p>
            <div className="h-px" style={{ background: "#111" }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#333" }}>Outcome Score by Stakes</p>
              <div className="space-y-2.5">
                {Object.entries(outcomes?.scoreByStakes ?? {}).map(([stakes, score]) => (
                  <ProgressRow
                    key={stakes}
                    label={stakes.charAt(0).toUpperCase() + stakes.slice(1)}
                    value={Math.round(score as number)}
                    max={100}
                    percent={Math.round(score as number)}
                    color={STAKES_COLORS[stakes] ?? "#666"}
                  />
                ))}
                {Object.keys(outcomes?.scoreByStakes ?? {}).length === 0 && (
                  <p className="text-sm" style={{ color: "#333" }}>No outcome data yet — score your decisions to see trends</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stakes Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "#f97316" }} />
              Stakes Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {["critical", "high", "medium", "low"].map((stakes) => {
                const count = stakesCounts[stakes] ?? 0;
                const pct = Math.round((count / totalByStakes) * 100);
                return (
                  <div key={stakes} className="rounded-xl p-4 border"
                    style={{ background: `${STAKES_COLORS[stakes]}08`, borderColor: `${STAKES_COLORS[stakes]}20` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: STAKES_COLORS[stakes] }}>
                      {stakes}
                    </p>
                    <p className="text-2xl font-black text-white">{count}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#444" }}>{pct}% of total</p>
                  </div>
                );
              })}
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {["critical", "high", "medium", "low"].map((stakes) => {
                const count = stakesCounts[stakes] ?? 0;
                const pct = (count / totalByStakes) * 100;
                if (pct === 0) return null;
                return (
                  <div key={stakes} style={{ width: `${pct}%`, background: STAKES_COLORS[stakes] }} />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: "#333" }}>
              <span>Critical</span>
              <span>{totalByStakes} total decisions</span>
              <span>Low</span>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate + Quick Actions */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "#8b5cf6" }} />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Win Rate */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#111" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b5cf6" strokeWidth="3"
                    strokeDasharray={`${(outcomes?.winRate ?? 0) * 100} 100`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-white">{Math.round((outcomes?.winRate ?? 0) * 100)}%</span>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold text-base">Win Rate</p>
                <p className="text-sm mt-0.5" style={{ color: "#555" }}>
                  Decisions with outcome score ≥ 70%
                </p>
                <p className="text-sm mt-1" style={{ color: "#444" }}>
                  Avg score: <span className="text-white font-semibold">{outcomes?.avgScore ?? 0}%</span>
                </p>
              </div>
            </div>

            <div className="h-px" style={{ background: "#111" }} />

            {/* Quick links */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#333" }}>Quick Actions</p>
              <div className="space-y-1">
                {[
                  { label: "View all decisions", href: "/decisions", icon: BrainCircuit },
                  { label: "Score pending outcomes", href: "/outcomes", icon: Target },
                  { label: "Review unread alerts", href: "/alerts", icon: Bell },
                  { label: "Analyze patterns", href: "/patterns", icon: BarChart2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: "#444" }} />
                        <span className="text-sm flex-1" style={{ color: "#666" }}>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#DC2626" }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This month summary */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-lg">This Month</p>
              <p className="text-sm mt-1" style={{ color: "#555" }}>
                <span className="text-white font-semibold">{overview?.decisionsThisMonth ?? 0}</span> decisions logged ·{" "}
                <span className="text-white font-semibold">{overview?.unreadAlerts ?? 0}</span> alerts ·{" "}
                <span className="text-white font-semibold">{overview?.pendingOutcomes ?? 0}</span> outcomes pending
              </p>
            </div>
            <Link href="/decisions">
              <Button size="sm" className="flex items-center gap-2 font-semibold" style={{ background: "#DC2626", color: "white" }}>
                View Decision Log
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

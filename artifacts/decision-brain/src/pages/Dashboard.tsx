import { useGetAnalyticsOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { BrainCircuit, AlertTriangle, Target, Activity, TrendingUp, ArrowUpRight } from "lucide-react";

const RED   = "#DC2626";
const RED_L = "#F87171";
const WHITE = "#E5E5E5";
const GRAY  = "#404040";

const STAKES_COLORS: Record<string, string> = {
  low:      GRAY,
  medium:   WHITE,
  high:     RED_L,
  critical: RED,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}>
      {label && <p className="text-white/50 mb-1 text-xs">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color || RED }}>
          {p.name ? `${p.name}: ` : ""}{p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetAnalyticsOverview();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" style={{ background: "#111" }} />
          <Skeleton className="h-4 w-48" style={{ background: "#111" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" style={{ background: "#111" }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" style={{ background: "#111" }} />
          <Skeleton className="h-80" style={{ background: "#111" }} />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const stakesData = Object.entries(analytics.decisionsByStakes).map(([name, value]) => ({ name, value }));

  const STAT_CARDS = [
    {
      label: "Total Decisions",
      value: analytics.totalDecisions,
      sub: `+${analytics.decisionsThisMonth} this month`,
      icon: BrainCircuit,
      accent: RED,
      highlight: false,
    },
    {
      label: "Avg Outcome Score",
      value: `${analytics.avgOutcomeScore.toFixed(1)}`,
      sub: "Out of 100 possible",
      icon: TrendingUp,
      accent: WHITE,
      highlight: false,
    },
    {
      label: "Unread Alerts",
      value: analytics.unreadAlerts,
      sub: "Blind spots & patterns",
      icon: AlertTriangle,
      accent: RED,
      highlight: true,
    },
    {
      label: "Pending Outcomes",
      value: analytics.pendingOutcomes,
      sub: "Awaiting your review",
      icon: Activity,
      accent: WHITE,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Intelligence Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#555" }}>Your executive decision velocity and outcomes.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
          style={{ borderColor: "rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.07)", color: RED_L }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: RED }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: RED }} />
          </span>
          Live
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="relative rounded-2xl border overflow-hidden flex flex-col p-5"
            style={{
              background: card.highlight ? "rgba(220,38,38,0.06)" : "#0d0d0d",
              borderColor: card.highlight ? "rgba(220,38,38,0.3)" : "#1c1c1c",
            }}>
            {card.highlight && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(220,38,38,0.12), transparent 70%)" }} />
            )}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#444" }}>{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.highlight ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.05)" }}>
                <card.icon className="w-4 h-4" style={{ color: card.accent }} />
              </div>
            </div>
            <p className="text-4xl font-bold text-white relative z-10" style={{ color: card.highlight ? RED_L : "#fff" }}>
              {card.value}
            </p>
            <div className="flex items-center gap-1 mt-2 relative z-10">
              <ArrowUpRight className="w-3 h-3" style={{ color: card.accent }} />
              <p className="text-xs" style={{ color: "#444" }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Decision Velocity — area chart, wider */}
        <div className="lg:col-span-3 rounded-2xl border p-6" style={{ background: "#0d0d0d", borderColor: "#1c1c1c" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Decision Velocity</h3>
              <p className="text-xs mt-0.5" style={{ color: "#444" }}>Decisions logged over time</p>
            </div>
            <div className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(220,38,38,0.1)", color: RED_L }}>
              This year
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.decisionVelocity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#2a2a2a" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#444" }} />
                <YAxis stroke="#2a2a2a" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#444" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={RED}
                  strokeWidth={2.5}
                  fill="url(#redGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: RED, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stakes breakdown — donut */}
        <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col" style={{ background: "#0d0d0d", borderColor: "#1c1c1c" }}>
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Stakes Breakdown</h3>
            <p className="text-xs mt-0.5" style={{ color: "#444" }}>Risk distribution across portfolio</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-full h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stakesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stakesData.map((entry, index) => (
                      <Cell key={index} fill={STAKES_COLORS[entry.name] || RED} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2">
              {stakesData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STAKES_COLORS[entry.name] || RED }} />
                    <span className="capitalize text-xs" style={{ color: "#888" }}>{entry.name}</span>
                  </div>
                  <span className="font-semibold text-white text-xs tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom quick-stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Stakes", value: (analytics.decisionsByStakes as any)?.high ?? 0, color: RED_L },
          { label: "Critical",    value: (analytics.decisionsByStakes as any)?.critical ?? 0, color: RED },
          { label: "Reviewed",    value: analytics.totalDecisions - analytics.pendingOutcomes, color: WHITE },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border p-4 text-center" style={{ background: "#0d0d0d", borderColor: "#1c1c1c" }}>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "#444" }}>{item.label}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Zap,
  ChevronRight,
  Plus,
  Filter,
  BrainCircuit,
  Circle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Decision = {
  id: string;
  title: string;
  description: string | null;
  sourcePlatform: string | null;
  stakes: string;
  status: string;
  tags: string[];
  createdAt: string;
  alertCount?: number;
};

const STAKES_CONFIG: Record<string, {
  borderColor: string;
  numBg: string;
  numText: string;
  badge: string;
  badgeText: string;
  label: string;
}> = {
  critical: {
    borderColor: "#ef4444",
    numBg: "rgba(239,68,68,0.12)",
    numText: "#ef4444",
    badge: "rgba(239,68,68,0.12)",
    badgeText: "#ef4444",
    label: "Critical",
  },
  high: {
    borderColor: "#DC2626",
    numBg: "rgba(220,38,38,0.1)",
    numText: "#DC2626",
    badge: "rgba(220,38,38,0.1)",
    badgeText: "#DC2626",
    label: "High",
  },
  medium: {
    borderColor: "#f97316",
    numBg: "rgba(249,115,22,0.1)",
    numText: "#f97316",
    badge: "rgba(249,115,22,0.1)",
    badgeText: "#f97316",
    label: "Medium",
  },
  low: {
    borderColor: "#22c55e",
    numBg: "rgba(34,197,94,0.1)",
    numText: "#22c55e",
    badge: "rgba(34,197,94,0.1)",
    badgeText: "#22c55e",
    label: "Low",
  },
};

function daysOpen(dateStr: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

function InboxItem({ decision, index }: { decision: Decision; index: number }) {
  const [, setLocation] = useLocation();
  const cfg = STAKES_CONFIG[decision.stakes] ?? STAKES_CONFIG.medium;
  const days = daysOpen(decision.createdAt);
  const overdue = days > 3 && (decision.stakes === "critical" || decision.stakes === "high");
  const blocked = decision.alertCount && decision.alertCount > 0;
  const platform = decision.sourcePlatform ?? "manual";
  const tags = decision.tags.slice(0, 3);

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-white/10 group"
      style={{
        background: "#0a0a0a",
        borderColor: "#111",
        borderLeft: `3px solid ${cfg.borderColor}`,
      }}
      onClick={() => setLocation(`/briefing/${decision.id}`)}
    >
      {/* Priority number */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
        style={{ background: cfg.numBg, color: cfg.numText }}>
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-sm font-bold text-white leading-snug">{decision.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {overdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                Overdue {days - 3}d
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.badge, color: cfg.badgeText }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {decision.description && (
          <p className="text-[11px] leading-relaxed mb-2 line-clamp-2" style={{ color: "#555" }}>
            {decision.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {blocked && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium"
              style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
              <Zap className="w-3 h-3" />
              {decision.alertCount} alert{decision.alertCount !== 1 ? "s" : ""} flagged
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "#333" }}>
            <BrainCircuit className="w-3 h-3" style={{ color: "#DC2626" }} />
            AI briefing available
          </span>
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "#111", color: "#444", border: "1px solid #1a1a1a" }}>
              {tag}
            </span>
          ))}
          <span className="text-[10px] ml-auto" style={{ color: "#333" }}>
            <Clock className="w-3 h-3 inline mr-0.5" />
            Open {days}d · via {platform}
          </span>
        </div>
      </div>

      {/* Brief me button */}
      <Button size="sm" variant="outline"
        className="shrink-0 text-[11px] border-border opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-muted-foreground hover:text-white">
        Brief me
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );
}

const FILTERS = ["all", "critical", "high", "medium", "low"] as const;

export default function DecisionInbox() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/decisions?limit=20&status=open", { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as any;
          setDecisions(data.decisions ?? data ?? []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = filter === "all" ? decisions : decisions.filter((d) => d.stakes === filter);
  const overdue = decisions.filter((d) => {
    const days = daysOpen(d.createdAt);
    return days > 3 && (d.stakes === "critical" || d.stakes === "high");
  }).length;
  const blocked = decisions.filter((d) => (d.alertCount ?? 0) > 0).length;

  const STAT_CARDS = [
    { label: "Open Decisions", value: decisions.length, sub: overdue > 0 ? `${overdue} overdue` : "on track", subColor: overdue > 0 ? "#ef4444" : "#22c55e" },
    { label: "Overdue", value: overdue, sub: overdue > 0 ? "needs attention" : "none overdue", subColor: overdue > 0 ? "#ef4444" : "#22c55e" },
    { label: "With Alerts", value: blocked, sub: "flagged by AI", subColor: "#f97316" },
    { label: "Avg Open Days", value: decisions.length > 0 ? Math.round(decisions.reduce((s, d) => s + daysOpen(d.createdAt), 0) / decisions.length * 10) / 10 + "d" : "0d", sub: "target: 3d", subColor: "#888" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Decision Inbox
            {decisions.length > 0 && (
              <span className="text-base font-black px-2.5 py-0.5 rounded-full text-white"
                style={{ background: "#DC2626", boxShadow: "0 0 12px rgba(220,38,38,0.4)" }}>
                {decisions.length}
              </span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {decisions.length > 0
              ? `${decisions.length} open decision${decisions.length !== 1 ? "s" : ""} need your attention${overdue > 0 ? ` — ${overdue} overdue` : ""}`
              : "All decisions resolved — your inbox is clear"}
          </p>
        </div>
        <Link href="/decisions/new">
          <Button size="sm" className="flex items-center gap-2 font-semibold" style={{ background: "#DC2626", color: "white" }}>
            <Plus className="w-4 h-4" />
            Log decision
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-sm mb-2" style={{ color: "#444" }}>{s.label}</p>
              <p className="text-4xl font-black text-white">{s.value}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: s.subColor }}>{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 shrink-0" style={{ color: "#333" }} />
        {FILTERS.map((f) => {
          const count = f === "all" ? decisions.length : decisions.filter((d) => d.stakes === f).length;
          const cfg = f !== "all" ? STAKES_CONFIG[f] : null;
          return (
            <button key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize"
              style={filter === f
                ? { background: "rgba(220,38,38,0.15)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)" }
                : { background: "#111", color: "#444", border: "1px solid #1a1a1a" }}>
              {cfg && <Circle className="w-2.5 h-2.5" style={{ fill: cfg.borderColor, color: cfg.borderColor }} />}
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: filter === f ? "rgba(220,38,38,0.2)" : "#0a0a0a", color: filter === f ? "#DC2626" : "#333" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inbox list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #111" }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-white font-bold text-lg mb-2">
              {filter === "all" ? "Inbox clear" : `No ${filter} decisions`}
            </p>
            <p className="text-sm max-w-sm" style={{ color: "#444" }}>
              {filter === "all"
                ? "All open decisions have been resolved. Log a new decision to get started."
                : `No decisions at ${filter} stakes level right now.`}
            </p>
            <Link href="/decisions/new">
              <Button size="sm" className="mt-5 font-semibold" style={{ background: "#DC2626", color: "white" }}>
                + Log decision
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((d, i) => (
            <InboxItem key={d.id} decision={d} index={i} />
          ))}
        </div>
      )}

      {/* How it works — shown when empty */}
      {!loading && decisions.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <p className="text-white font-bold mb-4">How Decision Inbox works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Inbox className="w-5 h-5 text-red-500" />, title: "Auto-captured", desc: "Decisions from Gmail, Meet, Slack flow in automatically via live capture. Each one is prioritized by stakes and urgency." },
                { icon: <BrainCircuit className="w-5 h-5 text-red-500" />, title: "AI briefings", desc: "Click any decision for a Gemini-generated briefing: what you must know, experts to call, pattern matches, and a recommendation." },
                { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, title: "Resolve & learn", desc: "Once decided, the outcome is tracked against your historical pattern to build your decision intelligence over time." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4 border" style={{ background: "#0a0a0a", borderColor: "#111" }}>
                  <div className="mb-3">{item.icon}</div>
                  <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "#555" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

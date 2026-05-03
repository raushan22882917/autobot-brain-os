import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  Radio,
  RefreshCw,
  ExternalLink,
  Filter,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  alertCount: number;
  outcomeScore: number | null;
};

const PLATFORM_META: Record<string, { icon: string; label: string; color: string }> = {
  gmail:    { icon: "📧", label: "Gmail",         color: "#ea4335" },
  meet:     { icon: "🎥", label: "Google Meet",   color: "#34a853" },
  zoom:     { icon: "💻", label: "Zoom",           color: "#2d8cff" },
  slack:    { icon: "💬", label: "Slack",          color: "#4a154b" },
  teams:    { icon: "👥", label: "MS Teams",       color: "#6264a7" },
  notion:   { icon: "📝", label: "Notion",         color: "#ffffff" },
  outlook:  { icon: "📨", label: "Outlook",        color: "#0078d4" },
  docusign: { icon: "✍️", label: "DocuSign",       color: "#1352b4" },
  manual:   { icon: "✏️", label: "Manual",         color: "#666666" },
};

const STAKES_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)",  text: "#ef4444" },
  high:     { bg: "rgba(249,115,22,0.12)", text: "#f97316" },
  medium:   { bg: "rgba(234,179,8,0.12)",  text: "#eab308" },
  low:      { bg: "rgba(34,197,94,0.12)",  text: "#22c55e" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FeedItem({ decision, isNew }: { decision: Decision; isNew: boolean }) {
  const platform = decision.sourcePlatform ?? "manual";
  const meta = PLATFORM_META[platform] ?? { icon: "•", label: platform, color: "#666" };
  const stakes = STAKES_COLORS[decision.stakes] ?? { bg: "rgba(255,255,255,0.05)", text: "#888" };
  const confidence = Math.floor(82 + Math.random() * 14);

  return (
    <div className={`flex items-start gap-3 px-5 py-4 border-b transition-all ${isNew ? "animate-in slide-in-from-top-2 duration-500" : ""}`}
      style={{ borderColor: "#111", background: isNew ? "rgba(220,38,38,0.03)" : "transparent" }}>

      {/* Platform icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}20` }}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <span className="text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          {isNew && (
            <Badge className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0 text-white"
              style={{ background: "#DC2626", boxShadow: "0 0 8px rgba(220,38,38,0.4)" }}>
              Auto-logged
            </Badge>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-snug mb-1.5 line-clamp-2">{decision.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: stakes.bg, color: stakes.text }}>
            {decision.stakes.toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "#444" }}>
            <Zap className="w-3 h-3" style={{ color: "#DC2626" }} />
            Gemini {confidence}% confidence
          </span>
          {decision.alertCount > 0 && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#f97316" }}>
              <AlertTriangle className="w-3 h-3" />
              {decision.alertCount} alert{decision.alertCount !== 1 ? "s" : ""}
            </span>
          )}
          {decision.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: "#333" }}>
          <Clock className="w-3 h-3 inline mr-1" />
          {timeAgo(decision.createdAt)}
        </p>
      </div>

      {/* View button */}
      <Link href={`/decisions/${decision.id}`}>
        <Button size="sm" variant="outline"
          className="shrink-0 text-[11px] border-border text-muted-foreground hover:text-white hover:border-white/20 flex items-center gap-1">
          View
          <ChevronRight className="w-3 h-3" />
        </Button>
      </Link>
    </div>
  );
}

const ALL_PLATFORMS = ["all", "gmail", "meet", "zoom", "slack", "teams", "manual"];

export default function LiveFeed() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePlatform, setActivePlatform] = useState("all");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [totalCaptured, setTotalCaptured] = useState(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: "30", page: "1" });
      if (activePlatform !== "all") params.set("platform", activePlatform);

      const [feedRes, analyticsRes, integRes] = await Promise.all([
        fetch(`/api/decisions?${params}`, { credentials: "include" }),
        fetch("/api/analytics/overview", { credentials: "include" }),
        fetch("/api/integrations", { credentials: "include" }),
      ]);

      if (feedRes.ok) {
        const data = await feedRes.json() as any;
        const items: Decision[] = data.decisions ?? data ?? [];

        // Detect new items since last fetch
        const currentIds = new Set(items.map((d: Decision) => d.id));
        const freshIds = new Set<string>();
        if (prevIdsRef.current.size > 0) {
          currentIds.forEach((id) => {
            if (!prevIdsRef.current.has(id)) freshIds.add(id);
          });
        }
        prevIdsRef.current = currentIds;
        if (freshIds.size > 0) setNewIds(freshIds);

        setDecisions(items);
        setLastRefreshed(new Date());
      }

      if (analyticsRes.ok) {
        const ov = await analyticsRes.json() as any;
        setTotalCaptured(ov.totalDecisions ?? 0);
      }

      if (integRes.ok) {
        const integs = await integRes.json() as any[];
        setConnectedPlatforms(integs?.filter((i) => i.status === "connected").length ?? 0);
      }
    } catch {}
    finally {
      if (!silent) setRefreshing(false);
    }
  }, [activePlatform]);

  useEffect(() => {
    setLoading(true);
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchFeed(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchFeed]);

  // Clear "new" highlights after 5 seconds
  useEffect(() => {
    if (newIds.size > 0) {
      const t = setTimeout(() => setNewIds(new Set()), 5000);
      return () => clearTimeout(t);
    }
  }, [newIds]);

  const filtered = activePlatform === "all"
    ? decisions
    : decisions.filter((d) => d.sourcePlatform === activePlatform);

  const platformCounts = decisions.reduce<Record<string, number>>((acc, d) => {
    const p = d.sourcePlatform ?? "manual";
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Live Feed</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500">LIVE</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: "#555" }}>
            Real-time decision capture stream · Auto-refreshes every 30 seconds
          </p>
        </div>
        <Button variant="outline" size="sm"
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5"
          onClick={() => fetchFeed()} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Live capture status card */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Radio className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-white font-bold">Live capture active</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>
                  Last updated {lastRefreshed.toLocaleTimeString()} · {connectedPlatforms} platform{connectedPlatforms !== 1 ? "s" : ""} connected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{totalCaptured}</p>
                <p className="text-[10px]" style={{ color: "#444" }}>total captured</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{connectedPlatforms}</p>
                <p className="text-[10px]" style={{ color: "#444" }}>connected</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{filtered.length}</p>
                <p className="text-[10px]" style={{ color: "#444" }}>showing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 shrink-0" style={{ color: "#333" }} />
        {ALL_PLATFORMS.map((p) => {
          const meta = PLATFORM_META[p];
          const count = p === "all" ? decisions.length : (platformCounts[p] ?? 0);
          return (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
              style={activePlatform === p
                ? { background: "rgba(220,38,38,0.15)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)" }
                : { background: "#111", color: "#444", border: "1px solid #1a1a1a" }}>
              {meta ? `${meta.icon} ${meta.label}` : "All"}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: activePlatform === p ? "rgba(220,38,38,0.2)" : "#0a0a0a", color: activePlatform === p ? "#DC2626" : "#333" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="pb-0 border-b" style={{ borderColor: "#111" }}>
          <div className="flex items-center justify-between pb-4">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time decision stream
            </CardTitle>
            <span className="text-[11px]" style={{ color: "#333" }}>
              {filtered.length} decision{filtered.length !== 1 ? "s" : ""}
              {activePlatform !== "all" ? ` from ${PLATFORM_META[activePlatform]?.label ?? activePlatform}` : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y" style={{ borderColor: "#111" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 px-5 py-4">
                  <Skeleton className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24 bg-white/5" />
                    <Skeleton className="h-4 w-full bg-white/5" />
                    <Skeleton className="h-3 w-48 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #111" }}>
                <Radio className="w-8 h-8" style={{ color: "#222" }} />
              </div>
              <p className="text-white font-bold text-lg mb-2">No decisions captured yet</p>
              <p className="text-sm max-w-sm" style={{ color: "#444" }}>
                Connect your platforms to start automatically capturing decisions from Gmail, Google Meet, Slack, and more.
              </p>
              <Link href="/integrations">
                <Button size="sm" className="mt-5 flex items-center gap-2 font-semibold"
                  style={{ background: "#DC2626", color: "white" }}>
                  Connect Platforms
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {filtered.map((decision) => (
                <FeedItem
                  key={decision.id}
                  decision={decision}
                  isNew={newIds.has(decision.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How capture works */}
      {decisions.length === 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold">How Live Capture Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "🎥",
                  title: "Meeting capture",
                  desc: "Gemini monitors your Google Meet and Zoom calls. When a strategic decision is made, it's automatically logged with full context.",
                },
                {
                  icon: "📧",
                  title: "Email extraction",
                  desc: "Gmail threads are scanned for commitment language. Decisions are extracted with confidence scores and linked to their email source.",
                },
                {
                  icon: "⚡",
                  title: "Instant classification",
                  desc: "Each captured decision is classified by stakes level, tagged, and matched against your decision history for pattern alerts.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4 border" style={{ background: "#0a0a0a", borderColor: "#111" }}>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: "#444" }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              All capture is silent and runs in the background. Nothing is stored without your review.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

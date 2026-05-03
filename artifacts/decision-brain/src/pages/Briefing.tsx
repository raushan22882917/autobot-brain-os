import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Zap,
  RefreshCw,
  ChevronDown,
  UserCircle2,
  Clock,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Decision = {
  id: string;
  title: string;
  description: string | null;
  stakes: string;
  tags: string[];
  sourcePlatform: string | null;
  createdAt: string;
  alertCount?: number;
};

type BriefPoint = {
  icon: string;
  title: string;
  detail: string;
  type: "risk" | "opportunity" | "warning" | "action" | "info";
};

type Expert = {
  initials: string;
  name: string;
  role: string;
  reason: string;
  accuracy: number;
  color: string;
};

const TYPE_STYLES: Record<BriefPoint["type"], { bg: string; border: string; icon: React.ReactNode }> = {
  risk:        { bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.15)",  icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
  warning:     { bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.15)", icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> },
  opportunity: { bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.15)",  icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  action:      { bg: "rgba(220,38,38,0.06)",  border: "rgba(220,38,38,0.15)",  icon: <Zap className="w-4 h-4 text-red-500" /> },
  info:        { bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.15)", icon: <Lightbulb className="w-4 h-4 text-violet-400" /> },
};

const STAKES_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STAKES_COLORS: Record<string, string> = { critical: "#ef4444", high: "#DC2626", medium: "#f97316", low: "#22c55e" };

const STATIC_EXPERTS: Expert[] = [
  { initials: "RR", name: "Raghuram Rajan",       role: "Economist · ex-RBI Governor",        reason: "Macro risk and leverage ratio concerns. Accuracy on financial decisions: 91%.", accuracy: 91, color: "#22c55e" },
  { initials: "NK", name: "Nandan Nilekani",       role: "Infosys co-founder · Tech strategy", reason: "Digital and operational transformation. Called similar market moves correctly in the past.", accuracy: 84, color: "#DC2626" },
  { initials: "KM", name: "Kiran Mazumdar-Shaw",   role: "Biocon founder · Ecosystem builder",  reason: "Ground-level context and regulatory risk flagging. Has flagged risks correctly before.", accuracy: 79, color: "#f97316" },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 55 ? "#f97316" : "#ef4444";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#111" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${score} 100`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function msAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(ms / 3600000);
  if (h > 0) return `${h}h ago`;
  return "Just now";
}

export default function Briefing() {
  const params = useParams<{ id: string }>();
  const routeId = params?.id;

  // All available decisions (for the picker when no ID in route)
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // The currently selected decision
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loadingDecision, setLoadingDecision] = useState(true);

  // Briefing content
  const [brief, setBrief] = useState<BriefPoint[]>([]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Load all decisions for the picker (only when accessed without a specific ID)
  useEffect(() => {
    if (routeId && routeId !== "new") return;
    const fetchList = async () => {
      setLoadingList(true);
      try {
        const res = await fetch("/api/decisions?limit=50", { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as { decisions: Decision[] };
          const sorted = (data.decisions ?? []).sort((a, b) => {
            const stakeDiff = (STAKES_ORDER[a.stakes] ?? 2) - (STAKES_ORDER[b.stakes] ?? 2);
            if (stakeDiff !== 0) return stakeDiff;
            // more alerts first
            return (b.alertCount ?? 0) - (a.alertCount ?? 0);
          });
          setAllDecisions(sorted);
          // Auto-select most urgent
          if (sorted.length > 0) setDecision(sorted[0]);
        }
      } catch {}
      setLoadingList(false);
      setLoadingDecision(false);
    };
    fetchList();
  }, [routeId]);

  // Load specific decision by route ID
  useEffect(() => {
    if (!routeId || routeId === "new") return;
    const load = async () => {
      setLoadingDecision(true);
      try {
        const res = await fetch(`/api/decisions/${routeId}`, { credentials: "include" });
        if (res.ok) setDecision(await res.json() as Decision);
      } catch {}
      setLoadingDecision(false);
    };
    load();
  }, [routeId]);

  const generateBriefing = async (dec: Decision) => {
    setGenerating(true);
    setBrief([]);
    setRecommendation("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: `Generate a pre-decision briefing for: "${dec.title}". Stakes: ${dec.stakes}. Context: ${dec.description ?? "No description provided"}. Tags: ${dec.tags.join(", ")}.

Return ONLY a JSON object with this exact structure:
{
  "points": [
    { "icon": "1", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" },
    { "icon": "2", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" },
    { "icon": "3", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" },
    { "icon": "4", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" },
    { "icon": "5", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" }
  ],
  "recommendation": "2-3 sentence Gemini recommendation written as a trusted advisor"
}`,
        }),
      });
      if (res.ok) {
        const data = await res.json() as any;
        const text = (data.response ?? data.message ?? "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(text.slice(start, end + 1));
          if (Array.isArray(parsed.points)) setBrief(parsed.points.slice(0, 5));
          if (parsed.recommendation) setRecommendation(parsed.recommendation);
        }
      }
    } catch {}
    setGenerating(false);
  };

  // Auto-generate when decision changes
  useEffect(() => {
    if (decision) generateBriefing(decision);
  }, [decision?.id]);

  const selectDecision = (d: Decision) => {
    setDecision(d);
    setShowPicker(false);
  };

  const isLoading = loadingDecision || loadingList;
  const stakesColor = STAKES_COLORS[decision?.stakes ?? "medium"] ?? "#DC2626";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 bg-white/5 rounded-lg" />
          <Skeleton className="h-9 w-80 bg-white/5 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 bg-white/5 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-52 bg-white/5 rounded-xl" />
            <Skeleton className="h-36 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state — no decisions at all
  if (!decision && allDecisions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Link href="/inbox">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Inbox
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-white">Pre-Decision Briefing</h1>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <Inbox className="w-12 h-12 mx-auto mb-4" style={{ color: "#222" }} />
            <p className="text-white font-bold text-lg mb-2">No decisions logged yet</p>
            <p className="text-sm mb-6" style={{ color: "#444" }}>
              Log your first decision to generate an AI-powered pre-decision briefing from Gemini.
            </p>
            <Link href="/decisions">
              <Button size="sm" className="font-semibold" style={{ background: "#DC2626", color: "white" }}>
                Log a decision
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <Link href="/inbox">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Inbox
          </Button>
        </Link>

        {/* Decision picker (visible when accessed at /briefing without an ID) */}
        {!routeId && allDecisions.length > 1 && (
          <div className="relative flex-1">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors hover:border-white/20"
              style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: `${stakesColor}15`, color: stakesColor }}>
                  {decision?.stakes}
                </span>
                <span className="text-sm font-semibold text-white truncate">{decision?.title}</span>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#444" }} />
            </button>
            {showPicker && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border overflow-hidden shadow-2xl"
                style={{ background: "#0f0f0f", borderColor: "#1a1a1a" }}>
                {allDecisions.map((d) => {
                  const sc = STAKES_COLORS[d.stakes] ?? "#DC2626";
                  return (
                    <button key={d.id} onClick={() => selectDecision(d)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-0 hover:bg-white/5 transition-colors"
                      style={{ borderColor: "#111" }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: `${sc}15`, color: sc }}>
                        {d.stakes}
                      </span>
                      <span className="text-sm text-white truncate flex-1">{d.title}</span>
                      <span className="text-[10px] shrink-0" style={{ color: "#333" }}>{msAgo(d.createdAt)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Title when navigated from inbox with specific ID */}
        {routeId && decision && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="text-[10px] font-bold px-2 py-0.5"
                style={{ background: `${stakesColor}15`, color: stakesColor, border: `1px solid ${stakesColor}20` }}>
                {decision.stakes.toUpperCase()} STAKES
              </Badge>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: "#333" }}>
                <BrainCircuit className="w-3 h-3 text-red-500" />
                Gemini · {decision.tags.join(", ")}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white leading-tight">{decision.title}</h1>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => decision && generateBriefing(decision)} disabled={generating}
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5 shrink-0">
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      {/* Decision title when in picker mode */}
      {!routeId && decision && (
        <div className="flex items-start gap-3 px-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="text-[10px] font-bold px-2 py-0.5"
                style={{ background: `${stakesColor}15`, color: stakesColor, border: `1px solid ${stakesColor}20` }}>
                {decision.stakes.toUpperCase()} STAKES
              </Badge>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: "#333" }}>
                <Clock className="w-3 h-3" />
                {msAgo(decision.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: "#333" }}>
                <BrainCircuit className="w-3 h-3 text-red-500" />
                Auto-selected · highest urgency
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white leading-tight">{decision.title}</h1>
            {decision.description && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "#555" }}>{decision.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5 things to know */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-red-500" />
              5 things you must know before deciding
            </CardTitle>
            {generating && brief.length === 0 && (
              <p className="text-[11px]" style={{ color: "#555" }}>
                Gemini is analyzing your decision…
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {generating && brief.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border" style={{ borderColor: "#111", background: "#0a0a0a" }}>
                  <Skeleton className="w-7 h-7 rounded-lg bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48 bg-white/5" />
                    <Skeleton className="h-3 w-full bg-white/5" />
                    <Skeleton className="h-3 w-4/6 bg-white/5" />
                  </div>
                </div>
              ))
            ) : brief.length > 0 ? (
              brief.map((point, i) => {
                const style = TYPE_STYLES[point.type] ?? TYPE_STYLES.info;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-xl border"
                    style={{ background: style.bg, borderColor: style.border }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ background: "rgba(0,0,0,0.3)", color: "white" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {style.icon}
                        <p className="text-sm font-bold text-white">{point.title}</p>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: "#888" }}>{point.detail}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "#444" }}>No briefing yet. Hit Regenerate.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* Experts to consult */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-red-500" />
                3 experts you should call first
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STATIC_EXPERTS.map((expert) => (
                <div key={expert.initials} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                  style={{ borderColor: "#111" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${expert.color}15`, border: `1px solid ${expert.color}25`, color: expert.color }}>
                    {expert.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{expert.name}</p>
                    <p className="text-[10px] mb-1.5" style={{ color: "#444" }}>{expert.role}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>{expert.reason}</p>
                  </div>
                  <ScoreRing score={expert.accuracy} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gemini recommendation */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-red-500" />
                Gemini recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generating && !recommendation ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full bg-white/5" />
                  <Skeleton className="h-3 w-5/6 bg-white/5" />
                  <Skeleton className="h-3 w-4/6 bg-white/5" />
                </div>
              ) : recommendation ? (
                <>
                  <blockquote className="text-sm leading-relaxed italic border-l-2 pl-4 mb-5"
                    style={{ borderColor: "#DC2626", color: "#888" }}>
                    "{recommendation}"
                  </blockquote>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 font-semibold" style={{ background: "#DC2626", color: "white" }}>
                      Accept recommendation
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-border text-muted-foreground hover:text-white">
                      Override &amp; decide now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Button size="sm" onClick={() => decision && generateBriefing(decision)} disabled={generating}
                    className="font-semibold" style={{ background: "#DC2626", color: "white" }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate briefing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

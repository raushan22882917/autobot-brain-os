import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  BrainCircuit,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Clock,
  Zap,
  RefreshCw,
  ChevronRight,
  UserCircle2,
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

const STATIC_EXPERTS: Expert[] = [
  { initials: "RR", name: "Raghuram Rajan", role: "Economist · ex-RBI Governor", reason: "Macro risk assessment and leverage ratio concerns. Accuracy score on financial decisions: 91%.", accuracy: 91, color: "#22c55e" },
  { initials: "NK", name: "Nandan Nilekani", role: "Infosys co-founder · Tech strategy", reason: "Digital and operational transformation expertise. Called similar market moves correctly in past.", accuracy: 84, color: "#DC2626" },
  { initials: "KM", name: "Kiran Mazumdar-Shaw", role: "Biocon founder · Business ecosystem", reason: "Ground-level context and regulatory risk flagging. Has flagged risks correctly twice before.", accuracy: 79, color: "#f97316" },
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

export default function Briefing() {
  const params = useParams<{ id: string }>();
  const decisionId = params?.id;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [brief, setBrief] = useState<BriefPoint[]>([]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (decisionId && decisionId !== "new") {
          const res = await fetch(`/api/decisions/${decisionId}`, { credentials: "include" });
          if (res.ok) setDecision(await res.json() as Decision);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [decisionId]);

  const generateBriefing = async () => {
    if (!decision) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: `Generate a pre-decision briefing for: "${decision.title}". Stakes: ${decision.stakes}. Context: ${decision.description ?? "No description provided"}. Tags: ${decision.tags.join(", ")}.

Return ONLY a JSON object with this exact structure:
{
  "points": [
    { "icon": "1", "title": "short title", "detail": "detail text", "type": "risk|opportunity|warning|action|info" },
    ... (5 points total)
  ],
  "recommendation": "2-3 sentence Gemini recommendation as first person advisor"
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

  useEffect(() => {
    if (decision && brief.length === 0) generateBriefing();
  }, [decision]);

  const STAKES_COLORS: Record<string, string> = {
    critical: "#ef4444", high: "#DC2626", medium: "#f97316", low: "#22c55e",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 bg-white/5" />
          <div className="space-y-4">
            <Skeleton className="h-52 bg-white/5" />
            <Skeleton className="h-36 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!decision) {
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
            <BrainCircuit className="w-12 h-12 mx-auto mb-4" style={{ color: "#222" }} />
            <p className="text-white font-bold text-lg mb-2">Select a decision from your inbox</p>
            <p className="text-sm mb-6" style={{ color: "#444" }}>Click "Brief me" on any inbox item to generate an AI-powered pre-decision briefing.</p>
            <Link href="/inbox">
              <Button size="sm" className="font-semibold" style={{ background: "#DC2626", color: "white" }}>
                Open Inbox <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stakesColor = STAKES_COLORS[decision.stakes] ?? "#DC2626";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Link href="/inbox">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Inbox
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className="text-[10px] font-bold px-2 py-0.5"
              style={{ background: `${stakesColor}15`, color: stakesColor, border: `1px solid ${stakesColor}20` }}>
              {decision.stakes.toUpperCase()} STAKES
            </Badge>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "#333" }}>
              <BrainCircuit className="w-3 h-3 text-red-500" />
              Generated by Gemini · {decision.tags.join(", ")}
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white leading-tight">{decision.title}</h1>
          {decision.description && (
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#555" }}>{decision.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={generateBriefing} disabled={generating}
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5 shrink-0">
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5 things to know */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-red-500" />
              5 things you must know before deciding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generating && brief.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-7 h-7 rounded-lg bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48 bg-white/5" />
                    <Skeleton className="h-3 w-full bg-white/5" />
                  </div>
                </div>
              ))
            ) : brief.length > 0 ? (
              brief.map((point, i) => {
                const style = TYPE_STYLES[point.type] ?? TYPE_STYLES.info;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-xl border"
                    style={{ background: style.bg, borderColor: style.border }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.2)" }}>
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
                <p className="text-sm" style={{ color: "#444" }}>Log this decision first to generate a briefing.</p>
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: `${expert.color}20`, border: `1px solid ${expert.color}30`, color: expert.color }}>
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
                      Override & decide now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Button size="sm" onClick={generateBriefing} disabled={generating}
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

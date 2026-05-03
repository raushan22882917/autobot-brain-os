import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import {
  BookOpen, Download, Share2, BrainCircuit,
  ChevronRight, ChevronDown, Star, Award,
  Layers, Target, Flame, Shield, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type OverviewData = {
  totalDecisions: number;
  avgOutcomeScore: number;
  decisionsThisMonth: number;
  decisionsThisWeek: number;
  decisionsByStakes: Record<string, number>;
  decisionsByPlatform: Record<string, number>;
  pendingOutcomes: number;
};

type Chapter = {
  num: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const CHAPTERS: Chapter[] = [
  { num: 1, icon: <BrainCircuit className="w-4 h-4" />, title: "The decision philosophy of a builder",   desc: "How you think before deciding — your consistent principles extracted from every decision you've made." },
  { num: 2, icon: <Star className="w-4 h-4" />,         title: "Your highest-impact decisions",           desc: "The decisions with the strongest outcomes — what you saw that others didn't, and what happened next." },
  { num: 3, icon: <Target className="w-4 h-4" />,       title: "Decisions I would make differently",      desc: "Honest AI analysis of your lowest-outcome decisions and the lessons extracted from each." },
  { num: 4, icon: <Layers className="w-4 h-4" />,       title: "How you choose people — the pattern",     desc: "Leadership decisions analyzed — the hidden criteria you apply when hiring and promoting." },
  { num: 5, icon: <Shield className="w-4 h-4" />,       title: "What you stand for — values in action",   desc: "Values derived not from what you said — but from every decision you made when it was hard." },
  { num: 6, icon: <Flame className="w-4 h-4" />,        title: "Decisions under fire: crisis leadership", desc: "How your decision patterns shift under extreme time pressure, public scrutiny, or financial stress." },
  { num: 7, icon: <Award className="w-4 h-4" />,        title: "The legacy of your failures",             desc: "The decisions that didn't work — and how they shaped the leader you became." },
  { num: 8, icon: <BookOpen className="w-4 h-4" />,     title: "Patterns across your career",             desc: "How your decision-making has evolved. What you got better at, and what blind spots persisted." },
];

function computeTraits(data: OverviewData) {
  const total = data.totalDecisions;
  if (total === 0) return null;

  const stakes = data.decisionsByStakes;
  const platforms = data.decisionsByPlatform;
  const avg = data.avgOutcomeScore;
  const platformCount = Object.keys(platforms).length;

  const criticalPct = Math.min(100, Math.round(((stakes.critical ?? 0) / total) * 400));
  const highPlusPct = Math.min(100, Math.round((((stakes.high ?? 0) + (stakes.critical ?? 0)) / total) * 200));
  const speedProxy = Math.min(100, Math.max(10, 100 - Math.round((data.pendingOutcomes / Math.max(1, total)) * 100)));
  const externalCapture = Math.min(100, Math.round((platformCount / 5) * 100));
  const qualityBase = avg > 0 ? avg : 50;

  return [
    { label: "Long-term thinking",  value: Math.min(100, Math.max(15, qualityBase + 10)), color: "#DC2626" },
    { label: "People-first bias",   value: Math.min(100, Math.max(15, Math.round(qualityBase * 0.9))), color: "#DC2626" },
    { label: "Contrarian courage",  value: Math.min(100, Math.max(15, highPlusPct + 20)), color: "#8b5cf6" },
    { label: "Risk tolerance",      value: Math.min(100, Math.max(15, criticalPct + 30)), color: "#f97316" },
    { label: "Decision speed",      value: speedProxy, color: "#eab308" },
    { label: "External validation", value: Math.max(10, externalCapture), color: "#ef4444" },
  ];
}

function ProgressBar({ value, color, animate }: { value: number; color: string; animate: boolean }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <div className="h-full rounded-full transition-all duration-1000"
        style={{ width: animate ? `${value}%` : "0%", background: color }} />
    </div>
  );
}

export default function Legacy() {
  const { user } = useUser();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [generating, setGenerating] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [animateBars, setAnimateBars] = useState(false);

  const name = user?.fullName ?? "Executive";

  const loadOverview = async () => {
    try {
      const res = await fetch("/api/analytics/overview", { credentials: "include" });
      if (res.ok) setOverview(await res.json() as OverviewData);
    } catch {}
    setLoading(false);
    setTimeout(() => setAnimateBars(true), 100);
  };

  const generateFingerprint = async (data: OverviewData) => {
    if (generating) return;
    setGenerating(true);
    try {
      const context = `Total decisions: ${data.totalDecisions}. Avg outcome score: ${data.avgOutcomeScore}%. Stakes: ${JSON.stringify(data.decisionsByStakes)}. Platforms: ${Object.keys(data.decisionsByPlatform).join(", ")}. Pending outcomes: ${data.pendingOutcomes}.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: `You are an executive decision intelligence AI. Analyze ${name}'s leadership profile. ${context} Write a concise leadership fingerprint (2-3 sentences) starting with "Across your decisions,". Be specific about their decision style, primary strength, and one consistent pattern. No markdown. Second person only.`,
        }),
      });
      if (res.ok) {
        const d = await res.json() as any;
        setFingerprint(d.response ?? d.message ?? "");
      }
    } catch {}
    setGenerating(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/analytics/overview", { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as OverviewData;
          setOverview(data);
          setLoading(false);
          setTimeout(() => setAnimateBars(true), 100);
          // Auto-generate fingerprint if they have decisions
          if (data.totalDecisions > 0 && !fingerprint) {
            generateFingerprint(data);
          }
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    init();
  }, []);

  const traits = overview ? computeTraits(overview) : null;
  const hasData = (overview?.totalDecisions ?? 0) > 0;

  const tags = [
    `${CHAPTERS.length} chapters`,
    `${overview?.totalDecisions ?? 0} decisions`,
    `${Object.keys(overview?.decisionsByPlatform ?? {}).length} platform${Object.keys(overview?.decisionsByPlatform ?? {}).length !== 1 ? "s" : ""}`,
    overview?.avgOutcomeScore ? `${overview.avgOutcomeScore}% avg score` : "no outcomes yet",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Leadership Legacy</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            Your decision history, distilled into a leadership story — chapters, patterns, and a fingerprint only you could leave.
          </p>
        </div>
        {hasData && (
          <Badge style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            Built from {overview!.totalDecisions} real decisions
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile card */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            {/* Book cover */}
            <div className="rounded-xl p-5 mb-5 border"
              style={{ background: "linear-gradient(135deg, #0f0f0f, #1a0a0a)", borderColor: "#1a1a1a" }}>
              <div className="flex items-start gap-1.5 mb-3">
                <div className="w-0.5 h-16 rounded-full shrink-0" style={{ background: "#DC2626" }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#DC2626" }}>Leadership Legacy</p>
                  <p className="text-xl font-serif font-bold text-white leading-tight">The Decision Story of</p>
                  <p className="text-xl font-serif font-bold leading-tight" style={{ color: "#DC2626" }}>{name}</p>
                </div>
              </div>
              {loading ? (
                <div className="flex gap-2 flex-wrap">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-20 bg-white/5 rounded" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#555", border: "1px solid #1a1a1a" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Leadership profile bars */}
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "#333" }}>
              Leadership profile {hasData ? "— from real data" : "— log decisions to personalise"}
            </p>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-32 bg-white/5" />
                    <Skeleton className="h-1.5 flex-1 bg-white/5 rounded-full" />
                    <Skeleton className="h-3 w-8 bg-white/5" />
                  </div>
                ))}
              </div>
            ) : traits ? (
              <div className="space-y-3">
                {traits.map((trait) => (
                  <div key={trait.label} className="flex items-center gap-3">
                    <span className="text-[11px] w-36 shrink-0" style={{ color: "#666" }}>{trait.label}</span>
                    <ProgressBar value={trait.value} color={trait.color} animate={animateBars} />
                    <span className="text-[11px] font-black w-8 text-right"
                      style={{ color: trait.value < 40 ? "#ef4444" : "white" }}>
                      {trait.value}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {["Long-term thinking", "People-first bias", "Contrarian courage", "Risk tolerance", "Decision speed", "External validation"].map((label) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[11px] w-36 shrink-0" style={{ color: "#333" }}>{label}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#0f0f0f" }} />
                    <span className="text-[11px] w-8 text-right" style={{ color: "#222" }}>–</span>
                  </div>
                ))}
                <p className="text-[11px] pt-1" style={{ color: "#333" }}>Log decisions to see your profile</p>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button size="sm" className="flex-1 flex items-center justify-center gap-2 font-semibold"
                style={{ background: "#DC2626", color: "white" }}>
                <Download className="w-4 h-4" /> Export PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-white">
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chapters */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-500" />
              Report chapters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {CHAPTERS.map((ch) => (
              <div key={ch.num}
                className="rounded-xl border overflow-hidden transition-all cursor-pointer"
                style={{
                  borderColor: expanded === ch.num ? "#1a1a1a" : "#0f0f0f",
                  background: expanded === ch.num ? "#0f0f0f" : "transparent",
                }}
                onClick={() => setExpanded(expanded === ch.num ? null : ch.num)}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                    style={{
                      background: expanded === ch.num ? "#DC2626" : "rgba(220,38,38,0.1)",
                      color: expanded === ch.num ? "white" : "#DC2626",
                    }}>
                    {ch.num}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span style={{ color: expanded === ch.num ? "#DC2626" : "#444" }}>{ch.icon}</span>
                    <p className="text-sm font-semibold truncate"
                      style={{ color: expanded === ch.num ? "white" : "#888" }}>
                      {ch.title}
                    </p>
                  </div>
                  {expanded === ch.num
                    ? <ChevronDown className="w-4 h-4 shrink-0 text-red-500" />
                    : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#333" }} />}
                </div>
                {expanded === ch.num && (
                  <div className="px-4 pb-3">
                    <p className="text-[12px] leading-relaxed" style={{ color: "#555" }}>{ch.desc}</p>
                  </div>
                )}
              </div>
            ))}
            <p className="text-[11px] text-center pt-2" style={{ color: "#333" }}>
              6 more chapters unlock as you log more decisions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gemini fingerprint — auto-generates if decisions exist */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-red-500" />
              Gemini leadership fingerprint
              {fingerprint && (
                <Badge style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  Generated
                </Badge>
              )}
            </CardTitle>
            {(fingerprint || hasData) && (
              <Button size="sm" variant="outline"
                onClick={() => overview && generateFingerprint(overview)} disabled={generating}
                className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating…" : fingerprint ? "Regenerate" : "Generate"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {generating && !fingerprint ? (
            <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: "#DC2626" }}>
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-4/6 bg-white/5" />
            </div>
          ) : fingerprint ? (
            <blockquote className="text-sm leading-relaxed italic border-l-2 pl-4"
              style={{ borderColor: "#DC2626", color: "#888" }}>
              "{fingerprint}"
            </blockquote>
          ) : (
            <div className="rounded-xl p-6 border text-center" style={{ background: "#0a0a0a", borderColor: "#111" }}>
              <BrainCircuit className="w-8 h-8 mx-auto mb-3" style={{ color: "#222" }} />
              <p className="text-white font-semibold mb-2">
                {hasData ? "Generating your fingerprint…" : "Log decisions to generate your fingerprint"}
              </p>
              <p className="text-sm max-w-md mx-auto" style={{ color: "#444" }}>
                {hasData
                  ? "Gemini is analyzing your decision patterns now. This takes a moment."
                  : "Once you have logged decisions, Gemini will synthesize your unique leadership DNA — strengths, patterns, and blind spots — into a single paragraph."}
              </p>
              {!hasData && (
                <Button size="sm" onClick={() => overview && generateFingerprint(overview)}
                  disabled={generating || !hasData}
                  className="mt-5 font-semibold" style={{ background: "#DC2626", color: "white" }}>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Generate fingerprint
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

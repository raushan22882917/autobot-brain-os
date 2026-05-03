import { useState } from "react";
import { useUser } from "@clerk/react";
import {
  BookOpen,
  Download,
  Share2,
  BrainCircuit,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
  Layers,
  Target,
  Flame,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Chapter = {
  num: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const PROFILE_TRAITS = [
  { label: "Long-term thinking",     value: 96, color: "#DC2626" },
  { label: "People-first bias",      value: 94, color: "#DC2626" },
  { label: "Contrarian courage",     value: 88, color: "#8b5cf6" },
  { label: "Risk tolerance",         value: 81, color: "#f97316" },
  { label: "Decision speed",         value: 72, color: "#eab308" },
  { label: "External validation",    value: 48, color: "#ef4444" },
];

const CHAPTERS: Chapter[] = [
  { num: 1,  icon: <BrainCircuit className="w-4 h-4" />, title: "The decision philosophy of a builder", desc: "How you think before deciding. Your 4 consistent principles extracted from every decision over the years." },
  { num: 2,  icon: <Star className="w-4 h-4" />,         title: "The 10 bets that built an empire",      desc: "Your 10 highest-impact decisions — what you saw that others didn't, and what happened next." },
  { num: 3,  icon: <Target className="w-4 h-4" />,       title: "The decisions I would make differently", desc: "Honest AI analysis of your lowest-outcome decisions and the lessons extracted from each." },
  { num: 4,  icon: <Layers className="w-4 h-4" />,       title: "How I choose people — the pattern",      desc: "Leadership decisions analyzed — the hidden criteria you apply when hiring and promoting." },
  { num: 5,  icon: <Shield className="w-4 h-4" />,       title: "What I stand for — values in action",    desc: "Values derived not from what you said — but from every decision you made when it was hard." },
  { num: 6,  icon: <Flame className="w-4 h-4" />,        title: "Decisions under fire: crisis leadership", desc: "How your decision patterns shift under extreme time pressure, public scrutiny, or financial crisis." },
  { num: 7,  icon: <Award className="w-4 h-4" />,        title: "The legacy of your failures",            desc: "The decisions that didn't work — and how they shaped the leader you became." },
  { num: 8,  icon: <BookOpen className="w-4 h-4" />,     title: "Patterns across three decades",          desc: "How your decision-making has evolved. What you got better at, and what blind spots persisted." },
];

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <div className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function Legacy() {
  const { user } = useUser();
  const [expanded, setExpanded] = useState<number | null>(1);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>("");

  const name = user?.fullName ?? "Executive";
  const firstName = user?.firstName ?? name;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: `You are an executive decision intelligence AI. Generate a concise "leadership fingerprint" paragraph (2-3 sentences) for ${name}. Write it as a Gemini AI observation, starting with "Across your decisions,". Focus on: long-term thinking, people-first approach, risk tolerance, decision speed, and their primary blind spot. Keep it profound, specific, and analytical. No markdown.`,
        }),
      });
      if (res.ok) {
        const data = await res.json() as any;
        setFingerprint(data.response ?? data.message ?? "");
        setGenerated(true);
      }
    } catch {}
    setGenerating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Leadership Legacy</h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>
          Your decision history, distilled into a leadership story — chapters, patterns, and a fingerprint only you could leave.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile card */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            {/* Book cover feel */}
            <div className="rounded-xl p-5 mb-5 border"
              style={{ background: "linear-gradient(135deg, #0f0f0f, #1a0a0a)", borderColor: "#1a1a1a" }}>
              <div className="flex items-start gap-1.5 mb-1">
                <div className="w-0.5 h-16 rounded-full" style={{ background: "#DC2626" }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#DC2626" }}>Leadership Legacy</p>
                  <p className="text-xl font-serif font-bold text-white leading-tight">The Decision Story of</p>
                  <p className="text-xl font-serif font-bold leading-tight" style={{ color: "#DC2626" }}>{name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["14 chapters", "22 years", "All decisions", "6 domains"].map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#555", border: "1px solid #1a1a1a" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Leadership profile */}
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "#333" }}>
              Overall Leadership Profile
            </p>
            <div className="space-y-3">
              {PROFILE_TRAITS.map((trait) => (
                <div key={trait.label} className="flex items-center gap-3">
                  <span className="text-[11px] w-36 shrink-0" style={{ color: "#666" }}>{trait.label}</span>
                  <ProgressBar value={trait.value} color={trait.color} />
                  <span className="text-[11px] font-black w-8 text-right" style={{ color: trait.value < 55 ? "#ef4444" : "white" }}>
                    {trait.value}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <Button size="sm" className="flex-1 flex items-center justify-center gap-2 font-semibold"
                style={{ background: "#DC2626", color: "white" }}>
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-white">
                <Share2 className="w-4 h-4" />
                Share
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
                style={{ borderColor: expanded === ch.num ? "#1a1a1a" : "#0f0f0f", background: expanded === ch.num ? "#0f0f0f" : "transparent" }}
                onClick={() => setExpanded(expanded === ch.num ? null : ch.num)}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 text-white"
                    style={{ background: expanded === ch.num ? "#DC2626" : "rgba(220,38,38,0.1)", color: expanded === ch.num ? "white" : "#DC2626" }}>
                    {ch.num}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span style={{ color: expanded === ch.num ? "#DC2626" : "#444" }}>{ch.icon}</span>
                    <p className="text-sm font-semibold truncate" style={{ color: expanded === ch.num ? "white" : "#888" }}>
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
            <p className="text-[11px] text-center pt-2" style={{ color: "#333" }}>+ 6 more chapters generated with your data</p>
          </CardContent>
        </Card>
      </div>

      {/* Gemini fingerprint */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-red-500" />
              Gemini insight — your leadership fingerprint
            </CardTitle>
            {!generated && (
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}
                className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : "Generate fingerprint"}
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
            <div className="rounded-xl p-5 border text-center" style={{ background: "#0a0a0a", borderColor: "#111" }}>
              <BrainCircuit className="w-8 h-8 mx-auto mb-3" style={{ color: "#222" }} />
              <p className="text-white font-semibold mb-2">Generate your leadership fingerprint</p>
              <p className="text-sm mb-5" style={{ color: "#444" }}>
                Gemini will analyze your full decision history and synthesize your unique leadership DNA into a concise, profound summary.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="font-semibold"
                style={{ background: "#DC2626", color: "white" }}>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Generate my fingerprint
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

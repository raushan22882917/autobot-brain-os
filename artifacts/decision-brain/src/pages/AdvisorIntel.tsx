import { useState } from "react";
import { Users, TrendingUp, TrendingDown, Award, Plus, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Advisor = {
  initials: string;
  name: string;
  domain: string;
  accuracy: number;
  advicePieces: number;
  correct: number;
  total: number;
  bestDomain: string;
  weakDomain?: string;
  lastAdvice: string;
  trend: "up" | "down" | "stable";
  barColors: string[];
  barHeights: number[];
  flag?: string;
  accentColor: string;
};

const ADVISORS: Advisor[] = [
  {
    initials: "RR", name: "Raghuram Rajan", domain: "Finance · Economics · RBI",
    accuracy: 91, advicePieces: 34, correct: 28, total: 31,
    bestDomain: "Macro risk", lastAdvice: "3 days ago", trend: "up",
    barColors: ["#5DCAA5","#5DCAA5","#5DCAA5","#5DCAA5","#1D9E75","#0F6E56"],
    barHeights: [70,85,90,80,95,100], accentColor: "#22c55e",
  },
  {
    initials: "NK", name: "Nandan Nilekani", domain: "Tech · Digital · Infosys",
    accuracy: 84, advicePieces: 28, correct: 20, total: 24,
    bestDomain: "Tech strategy", lastAdvice: "1 week ago", trend: "up",
    barColors: ["#AFA9EC","#AFA9EC","#AFA9EC","#7F77DD","#7F77DD","#534AB7"],
    barHeights: [65,80,75,85,90,88], accentColor: "#8b5cf6",
  },
  {
    initials: "KS", name: "Kumar Sinha", domain: "Operations · Supply chain",
    accuracy: 79, advicePieces: 22, correct: 15, total: 19,
    bestDomain: "Vendor selection", lastAdvice: "2 weeks ago", trend: "stable",
    barColors: ["#9FE1CB","#9FE1CB","#5DCAA5","#5DCAA5","#1D9E75","#0F6E56"],
    barHeights: [70,75,80,78,82,85], accentColor: "#22c55e",
  },
  {
    initials: "PS", name: "Prashant Shah", domain: "Investment · M&A · PE",
    accuracy: 61, advicePieces: 19, correct: 9, total: 15,
    bestDomain: "Deal structuring", weakDomain: "Integration planning",
    lastAdvice: "3 weeks ago", trend: "down",
    barColors: ["#FAC775","#FAC775","#FAC775","#EF9F27","#EF9F27","#BA7517"],
    barHeights: [70,55,65,50,60,55], accentColor: "#f97316",
  },
  {
    initials: "VB", name: "Vijay Bhatia", domain: "Legal · Regulatory",
    accuracy: 38, advicePieces: 13, correct: 3, total: 8,
    bestDomain: "Compliance", flag: "Review relationship",
    lastAdvice: "1 month ago", trend: "down",
    barColors: ["#F7C1C1","#F09595","#F09595","#E24B4A","#E24B4A","#A32D2D"],
    barHeights: [55,40,45,30,35,25], accentColor: "#ef4444",
  },
];

function MiniBar({ colors, heights }: { colors: string[]; heights: number[] }) {
  const max = Math.max(...heights, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm min-w-[4px]"
          style={{ height: `${(h / max) * 100}%`, background: colors[i] }} />
      ))}
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#111" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${score} 100`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const TrendIcon = advisor.trend === "up" ? TrendingUp : advisor.trend === "down" ? TrendingDown : Star;
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 hover:border-white/10 transition-all cursor-pointer"
      style={{ background: "#0a0a0a", borderColor: "#111" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: `${advisor.accentColor}15`, color: advisor.accentColor, border: `1.5px solid ${advisor.accentColor}30` }}>
          {advisor.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{advisor.name}</p>
          <p className="text-[10px]" style={{ color: "#444" }}>{advisor.domain}</p>
        </div>
        <ScoreRing score={advisor.accuracy} color={advisor.accentColor} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-y-1.5">
        {[
          { label: "Advice pieces", value: advisor.advicePieces },
          { label: "Followed & correct", value: `${advisor.correct} / ${advisor.total}`, color: advisor.accentColor },
          { label: "Best domain", value: advisor.bestDomain },
          { label: "Last advice", value: advisor.lastAdvice },
        ].map((row) => (
          <div key={row.label} className="flex flex-col">
            <span className="text-[10px]" style={{ color: "#333" }}>{row.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: (row as any).color ?? "#fff" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {advisor.flag && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
          <TrendingDown className="w-3 h-3" />
          {advisor.flag}
        </div>
      )}

      {/* Mini bar */}
      <div>
        <MiniBar colors={advisor.barColors} heights={advisor.barHeights} />
        <p className="text-[9px] mt-1" style={{ color: "#333" }}>Accuracy — last 6 months</p>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: advisor.accentColor }}>
        <TrendIcon className="w-3 h-3" />
        {advisor.trend === "up" ? "Accuracy improving" : advisor.trend === "down" ? "Accuracy declining" : "Accuracy stable"}
      </div>
    </div>
  );
}

export default function AdvisorIntel() {
  const [showAdd, setShowAdd] = useState(false);

  const topAccuracy = Math.max(...ADVISORS.map((a) => a.accuracy));
  const lowestAccuracy = Math.min(...ADVISORS.map((a) => a.accuracy));
  const totalAdvice = ADVISORS.reduce((s, a) => s + a.advicePieces, 0);

  const STAT_CARDS = [
    { label: "Advisors Tracked", value: ADVISORS.length, sub: "across 6 domains", icon: Users, color: "#DC2626" },
    { label: "Advice Pieces", value: totalAdvice, sub: "+18 this month", icon: Star, color: "#8b5cf6", subColor: "#22c55e" },
    { label: "Highest Accuracy", value: `${topAccuracy}%`, sub: ADVISORS.find((a) => a.accuracy === topAccuracy)?.name.split(" ")[1] ?? "", icon: Award, color: "#22c55e", subColor: "#22c55e" },
    { label: "Needs Review", value: `${lowestAccuracy}%`, sub: ADVISORS.find((a) => a.accuracy === lowestAccuracy)?.name.split(" ")[1] ?? "", icon: TrendingDown, color: "#ef4444", subColor: "#ef4444" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Advisor Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            Track who gives you good advice — and who doesn't. Accuracy scored by Gemini across all decisions.
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-2 font-semibold"
          style={{ background: "#DC2626", color: "white" }}
          onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Add advisor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm" style={{ color: "#444" }}>{s.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-4xl font-black text-white">{s.value}</p>
                <p className="text-[11px] mt-1" style={{ color: (s as any).subColor ?? "#555" }}>{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advisor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADVISORS.map((advisor) => (
          <AdvisorCard key={advisor.initials} advisor={advisor} />
        ))}

        {/* Add card */}
        <div
          onClick={() => setShowAdd(true)}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-52 cursor-pointer hover:border-white/10 transition-all"
          style={{ borderColor: "#1a1a1a" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a" }}>
            <Plus className="w-5 h-5" style={{ color: "#333" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#555" }}>Add advisor to track</p>
            <p className="text-[11px] mt-1 max-w-[160px]" style={{ color: "#333" }}>
              Gemini will detect their advice from your calls & emails
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <p className="text-white font-bold mb-4">How advisor intelligence works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🎧", title: "Auto-detection", desc: "Gemini monitors your meetings, emails, and calls. When an advisor provides input on a decision, it's automatically logged and attributed." },
              { icon: "📊", title: "Accuracy scoring", desc: "When decision outcomes are scored, every piece of advice linked to that decision is evaluated. Correct advice improves the advisor's accuracy." },
              { icon: "💡", title: "Smart routing", desc: "When you open a Pre-Decision Briefing, Gemini recommends the advisors with the highest accuracy for that specific decision domain." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl p-4 border" style={{ background: "#0a0a0a", borderColor: "#111" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "#555" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

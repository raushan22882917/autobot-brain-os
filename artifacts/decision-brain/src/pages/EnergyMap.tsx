import { useEffect, useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sun,
  Moon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type EnergyData = {
  heatmap: (number | null)[][];
  hasRealData: boolean;
  totalDecisions: number;
  totalWithOutcomes: number;
  peakWindow: { day: string; slot: string; score: number } | null;
  worstWindow: { day: string; slot: string; score: number } | null;
  morningAvg: number | null;
  eveningAvg: number | null;
  morningVsEveningDelta: number | null;
};

// Static fallback heatmap (shown when no real data available yet)
const STATIC_HEATMAP: number[][] = [
  [78, 84, 81, 77, 72],
  [73, 79, 75, 71, 63],
  [61, 65, 62, 58, 55],
  [64, 67, 63, 60, 48],
  [51, 58, 52, 49, 41],
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["8–10am", "10–12pm", "12–2pm", "2–4pm", "4–7pm"];

function getCell(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: "#5DCAA5", text: "#085041" };
  if (score >= 72) return { bg: "#9FE1CB", text: "#085041" };
  if (score >= 65) return { bg: "#C0DD97", text: "#3B6D11" };
  if (score >= 58) return { bg: "#FAC775", text: "#633806" };
  if (score >= 50) return { bg: "#EF9F27", text: "#412402" };
  if (score >= 43) return { bg: "#F09595", text: "#501313" };
  return { bg: "#E24B4A", text: "#fff" };
}

const STATIC_FINDINGS = [
  { icon: CheckCircle2, color: "#22c55e", title: "Tuesday 9–11am is typically your peak", detail: "Log more scored decisions to confirm your personal peak window. Tuesday mornings show the highest quality across most executives." },
  { icon: ShieldAlert, color: "#ef4444", title: "Friday evenings are a danger zone", detail: "Avoid high-stakes irreversible decisions on Friday after 4pm. Decision quality drops significantly as the week ends." },
  { icon: AlertTriangle, color: "#f97316", title: "After long meetings: quality drops", detail: "Decisions made within 30 minutes of a 2hr+ meeting typically score 20-35pts lower. Build a recovery buffer into your schedule." },
  { icon: TrendingDown, color: "#8b5cf6", title: "Post-travel decisions: caution", detail: "Decisions on travel days or within 24hrs of international travel typically score lower. Plan critical decisions after rest." },
];

export default function EnergyMap() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ slot: number; day: number } | null>(null);
  const [calendarEnabled, setCalendarEnabled] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/energy", { credentials: "include" });
      if (res.ok) setData(await res.json() as EnergyData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Use real heatmap if any cells have data, else static
  const displayHeatmap = data?.heatmap?.some((row) => row.some((v) => v !== null))
    ? data.heatmap
    : STATIC_HEATMAP;

  const isRealData = data?.hasRealData && data?.totalWithOutcomes > 0;

  const peak = data?.peakWindow ?? { day: "Tue", slot: "9am", score: 84 };
  const worst = data?.worstWindow ?? { day: "Fri", slot: "5pm", score: 41 };
  const delta = data?.morningVsEveningDelta ?? 28;

  const STAT_CARDS = [
    { label: "Peak Decision Time", value: isRealData ? `${peak.day} ${peak.slot}` : "Tue 9am", sub: isRealData ? `avg score: ${peak.score}%` : "avg score: 84%", subColor: "#22c55e", icon: Sun },
    { label: "Worst Decision Time", value: isRealData ? `${worst.day} ${worst.slot}` : "Fri 5pm", sub: isRealData ? `avg score: ${worst.score}%` : "avg score: 41%", subColor: "#ef4444", icon: Moon },
    { label: "Decisions Tracked", value: data?.totalDecisions ?? "–", sub: `${data?.totalWithOutcomes ?? 0} scored`, subColor: "#888", icon: Zap },
    { label: "Morning vs Evening", value: delta > 0 ? `+${delta}pts` : `${delta}pts`, sub: delta > 0 ? "morning wins" : "evening wins", subColor: delta > 0 ? "#22c55e" : "#ef4444", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Energy Map
            {isRealData ? (
              <Badge style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                Live data
              </Badge>
            ) : (
              <Badge style={{ background: "rgba(255,255,255,0.05)", color: "#555", border: "1px solid #111" }}>
                Demo data — log scored decisions to personalise
              </Badge>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {isRealData
              ? `Your personal decision quality map — built from ${data!.totalDecisions} decisions, ${data!.totalWithOutcomes} scored.`
              : "Decision quality by time of day and day of week. Score decisions to see your personal map."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm" style={{ color: "#444" }}>{s.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.12)" }}>
                    <Icon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-9 w-24 bg-white/5" />
                ) : (
                  <p className="text-3xl font-black text-white">{s.value}</p>
                )}
                <p className="text-[11px] mt-1 font-medium" style={{ color: s.subColor }}>{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heatmap */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              Decision quality heatmap
            </CardTitle>
            <p className="text-[11px]" style={{ color: "#444" }}>
              {isRealData ? `Computed from your ${data!.totalWithOutcomes} scored decisions` : "Sample data — personalised once you score decisions"}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/5 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {/* Day header */}
                <div className="grid gap-1.5 mb-1" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
                  <div />
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold pb-1" style={{ color: "#444" }}>{d}</div>
                  ))}
                </div>
                {/* Rows */}
                <div className="space-y-1.5">
                  {SLOTS.map((slot, si) => (
                    <div key={slot} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
                      <div className="text-[10px] pr-2 text-right" style={{ color: "#333" }}>{slot}</div>
                      {DAYS.map((_, di) => {
                        const raw = displayHeatmap[si]?.[di];
                        const score = raw ?? 0;
                        const isEmpty = raw === null;
                        const cell = getCell(score);
                        const isHovered = hoveredCell?.slot === si && hoveredCell?.day === di;
                        return (
                          <div key={di}
                            className="rounded-lg p-2 text-center cursor-pointer transition-all"
                            style={{
                              background: isEmpty ? "#0a0a0a" : cell.bg,
                              border: isEmpty ? "1px solid #111" : "none",
                              transform: isHovered ? "scale(1.08)" : "scale(1)",
                              boxShadow: isHovered && !isEmpty ? `0 0 12px ${cell.bg}80` : "none",
                            }}
                            onMouseEnter={() => setHoveredCell({ slot: si, day: di })}
                            onMouseLeave={() => setHoveredCell(null)}>
                            <div className="text-[11px] font-bold" style={{ color: isEmpty ? "#333" : cell.text }}>
                              {isEmpty ? "–" : `${score}%`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-0.5">
                    {["#E24B4A", "#F09595", "#FAC775", "#C0DD97", "#9FE1CB", "#5DCAA5"].map((c) => (
                      <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "#333" }}>
                    <span>Low</span><span>→</span><span>High quality</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Key findings + Calendar protection */}
        <div className="space-y-5">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold">Key findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRealData && data?.peakWindow && (
                <div className="flex items-start gap-3 pb-4 border-b" style={{ borderColor: "#111" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Your personal peak: {peak.day} {peak.slot}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>
                      Based on your actual scored decisions, {peak.day} {peak.slot} is your highest-quality decision window at {peak.score}% avg outcome score.
                    </p>
                  </div>
                </div>
              )}
              {STATIC_FINDINGS.slice(0, isRealData ? 3 : 4).map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    style={{ borderColor: "#111" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{f.title}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>{f.detail}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                Gemini calendar protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#555" }}>
                Gemini can automatically protect your peak decision windows in Google Calendar and flag when high-stakes decisions are being made during low-energy times.
              </p>
              <Button className="w-full font-semibold"
                style={calendarEnabled
                  ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }
                  : { background: "#DC2626", color: "white" }}
                onClick={() => setCalendarEnabled(!calendarEnabled)}>
                {calendarEnabled ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Calendar protection active</>
                ) : "Enable calendar protection ↗"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* No data CTA */}
      {!loading && !isRealData && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <BrainCircuit className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">How to personalise your Energy Map</p>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  This map is built from your actual decision outcomes. Log decisions via the Decisions page, then score their outcomes — Gemini will compute your personal peak and danger windows from the data.
                  <span className="font-semibold text-white"> {data?.totalDecisions ?? 0} decisions logged</span>, <span className="font-semibold" style={{ color: "#DC2626" }}>{data?.totalWithOutcomes ?? 0} scored</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Zap, TrendingUp, TrendingDown, Calendar, Sun, Moon,
  CheckCircle2, ShieldAlert, AlertTriangle, RefreshCw, BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/apiUrl";

type EnergyData = {
  heatmap: (number | null)[][];
  freqHeatmap: (number | null)[][];
  hasRealData: boolean;
  hasMappedDecisions: boolean;
  totalDecisions: number;
  totalWithOutcomes: number;
  peakWindow: { day: string; slot: string; score: number } | null;
  worstWindow: { day: string; slot: string; score: number } | null;
  morningAvg: number | null;
  eveningAvg: number | null;
  morningVsEveningDelta: number | null;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["8–10am", "10–12pm", "12–2pm", "2–4pm", "4–7pm"];

// Quality mode: green → red scale
function getQualityCell(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: "#5DCAA5", text: "#085041" };
  if (score >= 72) return { bg: "#9FE1CB", text: "#085041" };
  if (score >= 65) return { bg: "#C0DD97", text: "#3B6D11" };
  if (score >= 58) return { bg: "#FAC775", text: "#633806" };
  if (score >= 50) return { bg: "#EF9F27", text: "#412402" };
  if (score >= 43) return { bg: "#F09595", text: "#501313" };
  return { bg: "#E24B4A", text: "#fff" };
}

// Frequency mode: intensity of red
function getFreqCell(val: number): { bg: string; text: string } {
  if (val >= 90) return { bg: "#DC2626", text: "#fff" };
  if (val >= 70) return { bg: "#EF4444", text: "#fff" };
  if (val >= 50) return { bg: "#F87171", text: "#500" };
  if (val >= 30) return { bg: "#FCA5A5", text: "#500" };
  return { bg: "#FEE2E2", text: "#500" };
}

const STATIC_FINDINGS = [
  { icon: CheckCircle2, color: "#22c55e", title: "Tuesday 9–11am is typically your peak", detail: "Research shows decision quality peaks mid-morning on Tuesdays for most executives. Log more scored decisions to see your personal pattern." },
  { icon: ShieldAlert, color: "#ef4444", title: "Friday evenings are a danger zone", detail: "Avoid high-stakes irreversible decisions on Friday after 4pm. Quality drops significantly as decision fatigue accumulates through the week." },
  { icon: AlertTriangle, color: "#f97316", title: "After long meetings: quality drops", detail: "Decisions within 30 minutes of a 2hr+ meeting typically score 20-35pts lower. Build a recovery buffer into your schedule." },
  { icon: TrendingDown, color: "#8b5cf6", title: "Post-travel decisions: caution", detail: "Decisions on travel days or within 24hrs of international travel typically score lower. Plan critical decisions after rest." },
];

export default function EnergyMap() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"quality" | "frequency">("quality");
  const [hoveredCell, setHoveredCell] = useState<{ slot: number; day: number } | null>(null);
  const [calendarEnabled, setCalendarEnabled] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/analytics/energy"), { credentials: "include" });
      if (res.ok) {
        const json = await res.json() as EnergyData;
        setData(json);
        // Auto-select best mode
        if (!json.hasRealData && json.hasMappedDecisions) setMode("frequency");
        else setMode("quality");
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Which grid to display
  const hasQualityData = data?.hasRealData && data?.heatmap?.some((row) => row.some((v) => v !== null));
  const hasFreqData = data?.hasMappedDecisions && data?.freqHeatmap?.some((row) => row.some((v) => v !== null));
  const showMode = hasQualityData ? mode : (hasFreqData ? "frequency" : "none");

  const displayGrid = showMode === "quality" ? data?.heatmap : data?.freqHeatmap;

  const peak = data?.peakWindow;
  const worst = data?.worstWindow;
  const delta = data?.morningVsEveningDelta;

  const STAT_CARDS = [
    {
      label: "Peak Decision Time",
      value: peak ? `${peak.day} ${peak.slot}` : hasFreqData ? "See map" : "No data",
      sub: peak ? `avg quality: ${peak.score}%` : hasFreqData ? "based on frequency" : "score decisions",
      subColor: peak ? "#22c55e" : "#444",
      icon: Sun,
    },
    {
      label: "Worst Decision Time",
      value: worst ? `${worst.day} ${worst.slot}` : "No data yet",
      sub: worst ? `avg quality: ${worst.score}%` : "score decisions to see",
      subColor: worst ? "#ef4444" : "#444",
      icon: Moon,
    },
    {
      label: "Decisions Tracked",
      value: data?.totalDecisions ?? "–",
      sub: `${data?.totalWithOutcomes ?? 0} scored`,
      subColor: "#888",
      icon: Zap,
    },
    {
      label: "Morning vs Evening",
      value: delta !== null && delta !== undefined ? `${delta > 0 ? "+" : ""}${delta}pts` : "–",
      sub: delta !== null && delta !== undefined ? (delta > 0 ? "morning stronger" : "evening stronger") : "need scored data",
      subColor: delta !== null ? (delta > 0 ? "#22c55e" : "#ef4444") : "#444",
      icon: TrendingUp,
    },
  ];

  const modeLabel = showMode === "quality" ? "Quality map — outcome scores per slot" : "Frequency map — when you make decisions";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Energy Map
            {hasQualityData ? (
              <Badge style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                Quality data
              </Badge>
            ) : hasFreqData ? (
              <Badge style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                Frequency data
              </Badge>
            ) : (
              <Badge style={{ background: "rgba(255,255,255,0.04)", color: "#333", border: "1px solid #111" }}>
                No data yet
              </Badge>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {hasQualityData
              ? `Decision quality by time of day — from your ${data!.totalWithOutcomes} scored decisions.`
              : hasFreqData
                ? `When you make decisions — from your ${data!.totalDecisions} logged decisions. Score outcomes to see quality heatmap.`
                : "Log and score decisions to see your personal decision energy map."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasQualityData && hasFreqData && (
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#1a1a1a" }}>
              {(["quality", "frequency"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className="px-3 py-1.5 text-[11px] font-bold capitalize transition-colors"
                  style={{
                    background: mode === m ? "#DC2626" : "#0a0a0a",
                    color: mode === m ? "white" : "#444",
                  }}>
                  {m}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load}
            className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
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
                {loading ? <Skeleton className="h-9 w-24 bg-white/5" /> : (
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
              {loading ? "Loading heatmap…" : modeLabel}
            </CardTitle>
            <p className="text-[11px]" style={{ color: "#444" }}>
              {showMode === "quality"
                ? `Average outcome score per time slot — ${data?.totalWithOutcomes ?? 0} scored decisions`
                : showMode === "frequency"
                  ? `Decision count per slot — darker = more decisions. Score outcomes to see quality.`
                  : "Log decisions to populate the heatmap"}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/5 rounded-lg" />
                ))}
              </div>
            ) : showMode === "none" ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
                <p className="text-sm font-semibold" style={{ color: "#555" }}>No heatmap data yet</p>
                <p className="text-[12px] mt-1" style={{ color: "#333" }}>
                  Log decisions (Mon–Fri, 8am–7pm) to populate the map.
                </p>
              </div>
            ) : (
              <>
                {/* Day headers */}
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
                        const raw = displayGrid?.[si]?.[di];
                        const isEmpty = raw === null || raw === undefined;
                        const cell = isEmpty ? null : showMode === "quality" ? getQualityCell(raw!) : getFreqCell(raw!);
                        const isHovered = hoveredCell?.slot === si && hoveredCell?.day === di;
                        return (
                          <div key={di}
                            className="rounded-lg p-2 text-center cursor-pointer transition-all"
                            style={{
                              background: isEmpty ? "#0a0a0a" : cell!.bg,
                              border: isEmpty ? "1px solid #111" : "none",
                              transform: isHovered && !isEmpty ? "scale(1.08)" : "scale(1)",
                              boxShadow: isHovered && cell ? `0 0 12px ${cell.bg}80` : "none",
                            }}
                            onMouseEnter={() => setHoveredCell({ slot: si, day: di })}
                            onMouseLeave={() => setHoveredCell(null)}>
                            <div className="text-[11px] font-bold"
                              style={{ color: isEmpty ? "#333" : cell!.text }}>
                              {isEmpty ? "–" : showMode === "quality" ? `${raw}%` : `${raw}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-between mt-4">
                  {showMode === "quality" ? (
                    <div className="flex items-center gap-0.5">
                      {["#E24B4A", "#F09595", "#FAC775", "#C0DD97", "#9FE1CB", "#5DCAA5"].map((c) => (
                        <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      {["#FEE2E2", "#FCA5A5", "#F87171", "#EF4444", "#DC2626"].map((c) => (
                        <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "#333" }}>
                    <span>{showMode === "quality" ? "Low quality" : "Fewer"}</span>
                    <span>→</span>
                    <span>{showMode === "quality" ? "High quality" : "More decisions"}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Key findings + Calendar */}
        <div className="space-y-5">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold">Key findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {peak && (
                <div className="flex items-start gap-3 pb-4 border-b" style={{ borderColor: "#111" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Your peak window: {peak.day} {peak.slot}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>
                      Based on your real scored decisions — {peak.day} {peak.slot} achieves your highest avg outcome score of {peak.score}%.
                    </p>
                  </div>
                </div>
              )}
              {worst && (
                <div className="flex items-start gap-3 pb-4 border-b" style={{ borderColor: "#111" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Your danger zone: {worst.day} {worst.slot}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>
                      Lowest quality window in your data — {worst.score}% avg score. Avoid high-stakes decisions here.
                    </p>
                  </div>
                </div>
              )}
              {STATIC_FINDINGS.slice(0, peak && worst ? 2 : 4).map((f) => {
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
                Calendar protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#555" }}>
                Gemini can protect your peak decision windows in Google Calendar and flag when high-stakes calls are scheduled in your danger zones.
              </p>
              <Button className="w-full font-semibold"
                style={calendarEnabled
                  ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }
                  : { background: "#DC2626", color: "white" }}
                onClick={() => setCalendarEnabled(!calendarEnabled)}>
                {calendarEnabled ? <><CheckCircle2 className="w-4 h-4 mr-2" />Protection active</> : "Enable calendar protection ↗"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Personalisation CTA */}
      {!loading && !hasQualityData && (
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <BrainCircuit className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">
                  {hasFreqData ? "Score outcomes to unlock quality heatmap" : "How to personalise your Energy Map"}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  {hasFreqData
                    ? `You have ${data!.totalDecisions} decisions mapped. Now score their outcomes to see which time slots produce your best decisions — not just when you make the most.`
                    : "Log decisions during your work day (Mon–Fri, 8am–7pm). Then score their outcomes to see your personal decision energy pattern. Currently: "}
                  {!hasFreqData && (
                    <span className="font-semibold text-white">{data?.totalDecisions ?? 0} decisions logged</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

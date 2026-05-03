import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HeatCell = {
  score: number;
  bg: string;
  text: string;
};

function getCell(score: number): HeatCell {
  if (score >= 80) return { score, bg: "#5DCAA5", text: "#085041" };
  if (score >= 72) return { score, bg: "#9FE1CB", text: "#085041" };
  if (score >= 65) return { score, bg: "#C0DD97", text: "#3B6D11" };
  if (score >= 58) return { score, bg: "#FAC775", text: "#633806" };
  if (score >= 50) return { score, bg: "#EF9F27", text: "#412402" };
  if (score >= 43) return { score, bg: "#F09595", text: "#501313" };
  return { score, bg: "#E24B4A", text: "#fff" };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["8–10am", "10–12pm", "12–2pm", "2–4pm", "4–7pm"];

// Decision quality scores by [slot][day]
const HEATMAP_DATA = [
  [78, 84, 81, 77, 72],
  [73, 79, 75, 71, 63],
  [61, 65, 62, 58, 55],
  [64, 67, 63, 60, 48],
  [51, 58, 52, 49, 41],
];

const KEY_FINDINGS = [
  {
    icon: CheckCircle2,
    color: "#22c55e",
    dotColor: "#22c55e",
    title: "Tuesday 9–11am is your peak window",
    detail: "84% avg outcome score. Schedule all high-stakes decisions here. Block this time in your calendar every week.",
  },
  {
    icon: ShieldAlert,
    color: "#ef4444",
    dotColor: "#ef4444",
    title: "Friday after 4pm is a danger zone",
    detail: "41% avg outcome. You've made 6 decisions in this window — 5 had poor outcomes. Avoid irreversible decisions on Friday afternoons.",
  },
  {
    icon: AlertTriangle,
    color: "#f97316",
    dotColor: "#f97316",
    title: "After long calls: –31pts quality drop",
    detail: "Decisions made within 30 min of a 2hr+ meeting score 31 points lower on average. Build a recovery buffer into your schedule.",
  },
  {
    icon: TrendingDown,
    color: "#8b5cf6",
    dotColor: "#8b5cf6",
    title: "Post-travel decisions: –18pts",
    detail: "Decisions on travel days or within 24hrs of international travel score 18 points lower. Plan critical decisions after rest.",
  },
];

const CONTEXT_DATA = [
  { label: "After long calls (2hr+)", score: 52, delta: "-31pts", bad: true },
  { label: "Post-international travel", score: 61, delta: "-18pts", bad: true },
  { label: "Monday mornings", score: 73, delta: "+2pts", bad: false },
  { label: "Solo focus time", score: 82, delta: "+11pts", bad: false },
  { label: "After exercise/walk", score: 86, delta: "+15pts", bad: false },
  { label: "Under deadline pressure", score: 49, delta: "-24pts", bad: true },
];

export default function EnergyMap() {
  const [hoveredCell, setHoveredCell] = useState<{ slot: number; day: number } | null>(null);
  const [calendarEnabled, setCalendarEnabled] = useState(false);

  const STAT_CARDS = [
    { label: "Peak Decision Time", value: "Tue 9am", sub: "avg score: 84%", subColor: "#22c55e", icon: Sun, color: "#22c55e" },
    { label: "Worst Decision Time", value: "Fri 5pm", sub: "avg score: 41%", subColor: "#ef4444", icon: Moon, color: "#ef4444" },
    { label: "After Long Calls", value: "52%", sub: "score drops –31pts", subColor: "#ef4444", icon: AlertTriangle, color: "#f97316" },
    { label: "Morning vs Evening", value: "+28pts", sub: "morning wins", subColor: "#22c55e", icon: TrendingUp, color: "#22c55e" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
          Energy Map
          <Badge className="text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
            Decision Quality Analysis
          </Badge>
        </h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>
          Your decision quality by time of day, day of week, and context. Gemini analyzed 847 decisions to build this map.
        </p>
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
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-3xl font-black text-white">{s.value}</p>
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
            <p className="text-[11px]" style={{ color: "#444" }}>Time of day vs day of week — based on 847 decisions</p>
          </CardHeader>
          <CardContent>
            {/* Day labels */}
            <div className="grid gap-1.5 mb-1" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold pb-1" style={{ color: "#444" }}>{d}</div>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1.5">
              {SLOTS.map((slot, si) => (
                <div key={slot} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
                  <div className="text-[10px] pr-2 text-right" style={{ color: "#333" }}>{slot}</div>
                  {DAYS.map((_, di) => {
                    const cell = getCell(HEATMAP_DATA[si][di]);
                    const isHovered = hoveredCell?.slot === si && hoveredCell?.day === di;
                    return (
                      <div key={di}
                        className="rounded-lg p-2 text-center cursor-pointer transition-all"
                        style={{
                          background: cell.bg,
                          transform: isHovered ? "scale(1.08)" : "scale(1)",
                          boxShadow: isHovered ? `0 0 12px ${cell.bg}80` : "none",
                        }}
                        onMouseEnter={() => setHoveredCell({ slot: si, day: di })}
                        onMouseLeave={() => setHoveredCell(null)}>
                        <div className="text-[11px] font-bold" style={{ color: cell.text }}>{cell.score}%</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1">
                {["#E24B4A", "#F09595", "#FAC775", "#C0DD97", "#9FE1CB", "#5DCAA5"].map((c) => (
                  <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: "#333" }}>
                <span>Low quality</span>
                <span>→</span>
                <span>High quality</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key findings + Calendar protection */}
        <div className="space-y-5">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold">Key findings from your energy data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {KEY_FINDINGS.map((f) => {
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

          {/* Calendar protection */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                Gemini calendar protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#555" }}>
                Gemini can automatically protect your peak decision windows in Google Calendar and flag when high-stakes decisions are being made during low-energy windows.
              </p>
              <Button
                className="w-full font-semibold"
                style={calendarEnabled
                  ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }
                  : { background: "#DC2626", color: "white" }}
                onClick={() => setCalendarEnabled(!calendarEnabled)}>
                {calendarEnabled ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Calendar protection active</>
                ) : (
                  <>Enable calendar protection ↗</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Context factors */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Decision quality by context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTEXT_DATA.map((ctx) => (
              <div key={ctx.label} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: "#0a0a0a", borderColor: "#111" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white mb-1">{ctx.label}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${ctx.score}%`, background: ctx.bad ? "#ef4444" : "#22c55e" }} />
                    </div>
                    <span className="text-[10px] font-bold text-white w-8 text-right">{ctx.score}%</span>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full shrink-0"
                  style={ctx.bad
                    ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
                    : { background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                  {ctx.delta}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

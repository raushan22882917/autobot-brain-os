import { useEffect, useState } from "react";
import {
  Users, TrendingUp, TrendingDown, Award, Plus,
  BrainCircuit, RefreshCw, Star, BarChart2, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Domain = {
  domain: string;
  count: number;
  avgScore: number | null;
  hasOutcomes: boolean;
  hasCritical: boolean;
};

type AiAdvisor = {
  name: string;
  initials: string;
  domain: string;
  reason: string;
  weakArea: string;
};

type AdvisorsData = {
  domains: Domain[];
  aiAdvisors: AiAdvisor[];
  totalDecisions: number;
  totalWithOutcomes: number;
  stakesCounts: Record<string, number>;
};

type PatternsData = {
  aiInsights: string[];
  decisionCount: number;
};

const ADVISOR_COLORS = ["#22c55e", "#8b5cf6", "#f97316", "#3b82f6", "#ec4899", "#eab308"];
const INITIALS_FALLBACKS = ["RR", "NK", "KM", "PS", "VB", "AR"];

function getScoreColor(score: number | null): string {
  if (score === null) return "#444";
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#f97316";
  return "#ef4444";
}

function DomainBar({ domain, maxCount }: { domain: Domain; maxCount: number }) {
  const pct = Math.round((domain.count / Math.max(1, maxCount)) * 100);
  const scoreColor = getScoreColor(domain.avgScore);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#0f0f0f" }}>
      <div className="w-28 shrink-0">
        <p className="text-[11px] font-semibold text-white truncate capitalize">{domain.domain}</p>
        <p className="text-[9px]" style={{ color: "#333" }}>{domain.count} decision{domain.count !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#111" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#DC2626" }} />
      </div>
      <div className="w-16 text-right shrink-0">
        {domain.hasOutcomes ? (
          <span className="text-[11px] font-black" style={{ color: scoreColor }}>
            {domain.avgScore}%
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: "#333" }}>no score</span>
        )}
        {domain.hasCritical && (
          <span className="block text-[9px] font-bold" style={{ color: "#DC2626" }}>critical</span>
        )}
      </div>
    </div>
  );
}

function AiAdvisorCard({ advisor, index }: { advisor: AiAdvisor; index: number }) {
  const color = ADVISOR_COLORS[index % ADVISOR_COLORS.length];
  const initials = advisor.initials || advisor.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 hover:border-white/10 transition-all"
      style={{ background: "#0a0a0a", borderColor: "#111" }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: `${color}12`, color, border: `1.5px solid ${color}25` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{advisor.name}</p>
          <p className="text-[10px]" style={{ color: "#444" }}>{advisor.domain}</p>
        </div>
        <Star className="w-4 h-4 shrink-0" style={{ color }} />
      </div>
      <div className="rounded-lg p-3 border" style={{ background: "#060606", borderColor: "#0f0f0f" }}>
        <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>{advisor.reason}</p>
      </div>
      {advisor.weakArea && (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 shrink-0" style={{ color }} />
          <p className="text-[10px]" style={{ color: "#444" }}>
            Covers: <span style={{ color: "#888" }}>{advisor.weakArea}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdvisorIntel() {
  const [data, setData] = useState<AdvisorsData | null>(null);
  const [patterns, setPatterns] = useState<PatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        fetch("/api/analytics/advisors", { credentials: "include" }),
        fetch("/api/analytics/patterns", { credentials: "include" }),
      ]);
      if (aRes.ok) setData(await aRes.json() as AdvisorsData);
      if (pRes.ok) setPatterns(await pRes.json() as PatternsData);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const domains = data?.domains ?? [];
  const aiAdvisors = data?.aiAdvisors ?? [];
  const insights = patterns?.aiInsights ?? [];
  const totalDecisions = data?.totalDecisions ?? 0;
  const totalWithOutcomes = data?.totalWithOutcomes ?? 0;
  const maxCount = Math.max(1, ...domains.map((d) => d.count));

  // Buckets for stakes breakdown
  const stakes = data?.stakesCounts ?? {};
  const critical = stakes.critical ?? 0;
  const high = stakes.high ?? 0;
  const medium = stakes.medium ?? 0;
  const low = stakes.low ?? 0;
  const total = critical + high + medium + low || 1;

  const STAT_CARDS = [
    { label: "Total Decisions", value: loading ? "–" : totalDecisions, sub: "analyzed by Gemini", icon: BarChart2, color: "#DC2626" },
    { label: "Domains Tracked", value: loading ? "–" : domains.length, sub: "from your tags", icon: Layers, color: "#8b5cf6" },
    { label: "Scored Decisions", value: loading ? "–" : totalWithOutcomes, sub: "with outcome data", icon: Award, color: "#22c55e", subColor: "#22c55e" },
    { label: "AI Advisors Found", value: loading ? "–" : aiAdvisors.length, sub: "matched to your gaps", icon: Users, color: "#f97316", subColor: "#f97316" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Advisor Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: "#555" }}>
            {totalDecisions > 0
              ? `Built from your ${totalDecisions} real decisions — domain performance + Gemini-matched advisors for your gaps.`
              : "Log decisions to unlock domain performance analytics and AI advisor matching."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}
          className="border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
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
                {loading ? (
                  <Skeleton className="h-9 w-16 bg-white/5" />
                ) : (
                  <p className="text-4xl font-black text-white">{s.value}</p>
                )}
                <p className="text-[11px] mt-1" style={{ color: (s as any).subColor ?? "#555" }}>{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Domain performance — REAL DATA */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              Your domain performance
              {totalDecisions > 0 && (
                <Badge style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  Live
                </Badge>
              )}
            </CardTitle>
            <p className="text-[11px]" style={{ color: "#444" }}>
              {domains.length > 0
                ? `${domains.length} domains from your decision tags. Scores shown for ${totalWithOutcomes} evaluated decisions.`
                : "Log decisions with tags to see domain-level performance."}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-24 bg-white/5" />
                    <Skeleton className="h-2 flex-1 bg-white/5 rounded-full" />
                    <Skeleton className="h-3 w-10 bg-white/5" />
                  </div>
                ))}
              </div>
            ) : domains.length > 0 ? (
              <div>
                {domains.map((d) => <DomainBar key={d.domain} domain={d} maxCount={maxCount} />)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Layers className="w-8 h-8 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
                <p className="text-sm font-semibold" style={{ color: "#555" }}>No domain data yet</p>
                <p className="text-[12px] mt-1" style={{ color: "#333" }}>
                  Add tags when logging decisions to see domain-level analytics.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stakes breakdown */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-red-500" />
              Stakes distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 bg-white/5 rounded-xl" />)}
              </div>
            ) : totalDecisions > 0 ? (
              <div className="space-y-3">
                {[
                  { label: "Critical", count: critical, color: "#ef4444" },
                  { label: "High",     count: high,     color: "#DC2626" },
                  { label: "Medium",   count: medium,   color: "#f97316" },
                  { label: "Low",      count: low,      color: "#22c55e" },
                ].map((s) => (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span style={{ color: s.color }} className="font-bold">{s.label}</span>
                      <span className="text-white font-black">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#111" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((s.count / total) * 100)}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] pt-2" style={{ color: "#333" }}>
                  {Math.round(((critical + high) / total) * 100)}% high-impact decisions
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "#444" }}>No decisions logged yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI-generated advisors — REAL DATA from Gemini */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base font-bold flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-red-500" />
            Gemini-matched advisors for your gaps
          </CardTitle>
          <p className="text-[11px]" style={{ color: "#444" }}>
            {aiAdvisors.length > 0
              ? `${aiAdvisors.length} advisors selected by Gemini based on your ${totalDecisions} decisions and domain weaknesses.`
              : totalDecisions > 0
                ? "Gemini is matching advisors to your decision history…"
                : "Log decisions so Gemini can match advisors to your specific gaps."}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 bg-white/5 rounded-xl" />)}
            </div>
          ) : aiAdvisors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiAdvisors.map((advisor, i) => (
                <AiAdvisorCard key={i} advisor={advisor} index={i} />
              ))}
              <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-36 cursor-pointer hover:border-white/10 transition-all"
                style={{ borderColor: "#1a1a1a" }}>
                <Plus className="w-5 h-5" style={{ color: "#333" }} />
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#555" }}>Add your own</p>
                  <p className="text-[10px] mt-0.5 max-w-[140px]" style={{ color: "#333" }}>Track a specific advisor's accuracy over time</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <BrainCircuit className="w-10 h-10 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
              <p className="text-white font-semibold mb-1">No advisors matched yet</p>
              <p className="text-sm" style={{ color: "#444" }}>
                {totalDecisions === 0
                  ? "Log your first decision to unlock Gemini advisor matching."
                  : "Refresh to ask Gemini to analyze your decision patterns and match advisors."}
              </p>
              {totalDecisions > 0 && (
                <Button size="sm" className="mt-4 font-semibold" style={{ background: "#DC2626", color: "white" }}
                  onClick={() => load(true)} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Match advisors
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real AI pattern insights */}
      {(loading || insights.length > 0) && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Gemini behavioral patterns — {patterns?.decisionCount ?? "–"} decisions analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className="rounded-xl p-4 border flex items-start gap-3"
                    style={{ background: "#0a0a0a", borderColor: "#111" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white"
                      style={{ background: "#DC2626" }}>
                      {i + 1}
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#888" }}>{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

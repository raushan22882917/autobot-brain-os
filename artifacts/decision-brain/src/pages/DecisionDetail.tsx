import { useGetDecision, useGetSimilarDecisions, getGetDecisionQueryKey, getGetSimilarDecisionsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, AlertTriangle, GitMerge, FileText, ShieldAlert, Calendar, Tag, ExternalLink } from "lucide-react";
import { Link, useParams } from "wouter";

const STAKES_CONFIG: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  low:      { label: "Low Stakes",      color: "#9ca3af", bg: "#ffffff06", bar: "#4b5563" },
  medium:   { label: "Medium Stakes",   color: "#a78bfa", bg: "#7c3aed08", bar: "#7c3aed" },
  high:     { label: "High Stakes",     color: "#fbbf24", bg: "#f59e0b08", bar: "#f59e0b" },
  critical: { label: "Critical Stakes", color: "#f87171", bg: "#dc262608", bar: "#DC2626" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  high:   { color: "#f87171", bg: "rgba(239,68,68,0.08)"  },
  medium: { color: "#fbbf24", bg: "rgba(245,158,11,0.08)" },
  low:    { color: "#9ca3af", bg: "#ffffff06"              },
};

const PLATFORM_LABELS: Record<string, string> = {
  gmail: "Gmail", meet: "Google Meet", zoom: "Zoom", slack: "Slack",
  teams: "Teams", notion: "Notion", outlook: "Outlook", docusign: "DocuSign", manual: "Manual",
};

export default function DecisionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: decision, isLoading } = useGetDecision(id || "", {
    query: { enabled: !!id, queryKey: getGetDecisionQueryKey(id || "") }
  });
  const { data: similarDecisions, isLoading: isLoadingSimilar } = useGetSimilarDecisions(id || "", {
    query: { enabled: !!id, queryKey: getGetSimilarDecisionsQueryKey(id || "") }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-28 rounded-xl" style={{ background: "#111" }} />
        <Skeleton className="h-14 w-3/4 rounded-xl" style={{ background: "#111" }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-56 rounded-2xl" style={{ background: "#111" }} />
            <Skeleton className="h-40 rounded-2xl" style={{ background: "#111" }} />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" style={{ background: "#111" }} />
            <Skeleton className="h-40 rounded-2xl" style={{ background: "#111" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!decision) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-white font-bold text-lg mb-2">Decision not found</p>
      <Link href="/decisions"><span className="text-sm" style={{ color: "#DC2626" }}>← Back to decisions</span></Link>
    </div>
  );

  const sc = STAKES_CONFIG[decision.stakes] ?? STAKES_CONFIG.medium;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/decisions">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:text-white"
            style={{ background: "#0a0a0a", color: "#444", border: "1px solid #141414" }}>
            <ArrowLeft className="w-4 h-4" />
            All Decisions
          </button>
        </Link>
      </div>

      {/* Title block */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
        <div className="h-1" style={{ background: sc.bar }} />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
              {sc.label}
            </span>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase"
              style={{ background: "#ffffff06", color: "#555", border: "1px solid #1e1e1e" }}>
              {decision.status}
            </span>
            {decision.sourcePlatform && (
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: "rgba(220,38,38,0.06)", color: "#888", border: "1px solid #1e1e1e" }}>
                via {PLATFORM_LABELS[decision.sourcePlatform] ?? decision.sourcePlatform}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mb-3">
            {decision.title}
          </h1>
          <div className="flex items-center gap-4 text-[11px]" style={{ color: "#2a2a2a" }}>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Recorded {new Date(decision.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {decision.outcomeScore !== null && decision.outcomeScore !== undefined && (
              <span className="flex items-center gap-1.5">
                <Target className="w-3 h-3" style={{ color: "#22c55e" }} />
                <span style={{ color: "#22c55e" }}>Outcome score: {decision.outcomeScore}/100</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Context */}
          <div className="rounded-2xl border p-6" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{ color: "#DC2626" }} />
              <h3 className="font-bold text-white text-[14px]">Context & Reasoning</h3>
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#666" }}>
              {decision.description || "No context provided for this decision."}
            </p>
            {decision.rawContext && (
              <div className="mt-5 p-4 rounded-xl text-xs font-mono overflow-auto"
                style={{ background: "#060606", border: "1px solid #1a1a1a", color: "#3a3a3a" }}>
                <div className="text-[9px] font-sans font-bold uppercase tracking-wider mb-2" style={{ color: "#333" }}>
                  Raw Extracted Data
                </div>
                {decision.rawContext}
              </div>
            )}
            {decision.tags && decision.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t" style={{ borderColor: "#161616" }}>
                <Tag className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#333" }} />
                {decision.tags.map((tag: string) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: "#111", color: "#555", border: "1px solid #1e1e1e" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Outcomes */}
          <div className="rounded-2xl border p-6" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4" style={{ color: "#22c55e" }} />
              <h3 className="font-bold text-white text-[14px]">Outcome Tracking</h3>
            </div>
            {decision.outcomes && decision.outcomes.length > 0 ? (
              <div className="space-y-3">
                {decision.outcomes.map((outcome: any) => (
                  <div key={outcome.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl justify-between items-start sm:items-center"
                    style={{ background: "#060606", border: "1px solid #161616" }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-white capitalize">{outcome.checkInterval.replace("_", " ")} Review</span>
                        <span className="text-[10px]" style={{ color: "#2a2a2a" }}>{new Date(outcome.trackedAt).toLocaleDateString()}</span>
                      </div>
                      {outcome.notes && <p className="text-[12px]" style={{ color: "#444" }}>{outcome.notes}</p>}
                    </div>
                    <div className="px-4 py-2 rounded-xl text-center shrink-0"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <span className="text-2xl font-bold" style={{ color: "#22c55e" }}>{outcome.score}</span>
                      <span className="text-xs font-normal ml-1" style={{ color: "#22c55e80" }}>/100</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Target className="w-8 h-8 mb-3" style={{ color: "#1e1e1e" }} />
                <p className="text-sm text-white mb-1">No outcomes tracked yet</p>
                <p className="text-xs" style={{ color: "#333" }}>Outcome reviews are automatically scheduled after logging.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Alerts */}
          <div className="rounded-2xl border p-5" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4" style={{ color: "#f59e0b" }} />
              <h3 className="font-bold text-white text-[14px]">Detected Alerts</h3>
              {decision.alerts && decision.alerts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                  {decision.alerts.length}
                </span>
              )}
            </div>
            {decision.alerts && decision.alerts.length > 0 ? (
              <div className="space-y-2">
                {decision.alerts.map((alert: any) => {
                  const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;
                  return (
                    <div key={alert.id} className="p-3 rounded-xl" style={{ background: sev.bg, border: `1px solid ${sev.color}25` }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-white leading-snug">{alert.title}</span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}30` }}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>{alert.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: "#22c55e" }} />
                </div>
                <p className="text-xs text-white mb-0.5">No alerts detected</p>
                <p className="text-[11px]" style={{ color: "#2a2a2a" }}>This decision looks clean.</p>
              </div>
            )}
          </div>

          {/* Similar decisions */}
          <div className="rounded-2xl border p-5" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="flex items-center gap-2 mb-4">
              <GitMerge className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <h3 className="font-bold text-white text-[14px]">Related Decisions</h3>
            </div>
            {isLoadingSimilar ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" style={{ background: "#111" }} />)}
              </div>
            ) : similarDecisions && similarDecisions.length > 0 ? (
              <div className="space-y-2">
                {similarDecisions.map((sim: any) => (
                  <Link key={sim.id} href={`/decisions/${sim.id}`}>
                    <div className="group p-3 rounded-xl cursor-pointer transition-all hover:border-white/10"
                      style={{ background: "#060606", border: "1px solid #161616" }}>
                      <p className="text-[12px] font-semibold text-white group-hover:text-red-400 transition-colors mb-1 leading-snug line-clamp-2">
                        {sim.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
                          {new Date(sim.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1">
                          {sim.outcomeScore && (
                            <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>
                              {sim.outcomeScore}/100
                            </span>
                          )}
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#DC2626" }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs" style={{ color: "#333" }}>No similar decisions found in history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

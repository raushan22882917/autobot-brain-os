import { useGetPendingOutcomes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const INTERVAL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "30_days":  { label: "30-Day Review",  color: "#a78bfa", bg: "rgba(124,58,237,0.08)" },
  "90_days":  { label: "90-Day Review",  color: "#22c55e", bg: "rgba(34,197,94,0.08)"  },
  "180_days": { label: "6-Month Review", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  "1_year":   { label: "Annual Review",  color: "#f87171", bg: "rgba(248,113,113,0.08)" },
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, color: "#f87171" };
  if (d === 0) return { label: "Due today",  color: "#f59e0b" };
  if (d <= 7)  return { label: `${d}d left`,  color: "#fbbf24" };
  return { label: `${d} days`, color: "#9ca3af" };
}

export default function Outcomes() {
  const { data: pendingOutcomes, isLoading } = useGetPendingOutcomes();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Outcome Tracker</h1>
          <p className="text-sm mt-1" style={{ color: "#444" }}>Review the real-world results of your past decisions.</p>
        </div>
        {pendingOutcomes && pendingOutcomes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Clock className="w-4 h-4" />
            {pendingOutcomes.length} pending
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Reviews",    value: pendingOutcomes?.length ?? 0, color: "#f59e0b", icon: Clock },
          { label: "Overdue",            value: pendingOutcomes?.filter((p: any) => new Date(p.dueAt) < new Date()).length ?? 0, color: "#f87171", icon: Target },
          { label: "Completed (all time)", value: "—", color: "#22c55e", icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#2a2a2a" }}>{s.label}</span>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending reviews */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
          <h2 className="text-base font-bold text-white">Pending Reviews</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" style={{ background: "#111" }} />)}
          </div>
        ) : pendingOutcomes && pendingOutcomes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOutcomes.map((pending: any, i: number) => {
              const interval = INTERVAL_CONFIG[pending.checkInterval] ?? { label: pending.checkInterval, color: "#9ca3af", bg: "#ffffff06" };
              const due = daysUntil(pending.dueAt);
              return (
                <Link key={i} href={`/decisions/${pending.decision.id}`}>
                  <div className="group rounded-2xl border overflow-hidden transition-all cursor-pointer hover:border-white/10"
                    style={{ background: "#0a0a0a", borderColor: "#141414" }}>
                    <div className="p-1.5 text-center text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: interval.bg, color: interval.color }}>
                      {interval.label}
                    </div>
                    <div className="p-5">
                      <h3 className="text-[14px] font-bold text-white mb-3 leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                        {pending.decision.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: due.color }}>
                          <Clock className="w-3 h-3" />
                          {due.label}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                          style={{ color: "#333" }}>
                          Log Score
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border text-center"
            style={{ background: "#0a0a0a", borderColor: "#141414" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: "#22c55e" }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">All caught up</h3>
            <p className="text-sm" style={{ color: "#333" }}>No pending outcome reviews at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

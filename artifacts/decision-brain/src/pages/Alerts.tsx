import { useState } from "react";
import { useListAlerts, useMarkAlertRead, getListAlertsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Eye, Bell, ShieldAlert, Clock } from "lucide-react";
import { Link } from "wouter";

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high:   { label: "High",   color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  low:    { label: "Low",    color: "#9ca3af", bg: "rgba(156,163,175,0.06)", border: "rgba(156,163,175,0.1)" },
};

const TYPE_LABELS: Record<string, string> = {
  pattern_match:    "Pattern Match",
  blind_spot:       "Blind Spot",
  repeated_mistake: "Repeated Mistake",
  urgency_bias:     "Urgency Bias",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "Just now";
}

export default function Alerts() {
  const [showRead, setShowRead] = useState(false);
  const { data: rawAlerts, isLoading } = useListAlerts({ unread: !showRead });
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : [];
  const markReadMutation = (useMarkAlertRead as any)();

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ unread: true }) });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ unread: false }) });
      }
    });
  };

  const unreadCount = !showRead ? alerts.length : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Alerts</h1>
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: "rgba(220,38,38,0.12)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#DC2626", display: "inline-block" }} />
                {unreadCount} unread
              </div>
            )}
          </div>
          <p className="text-sm" style={{ color: "#444" }}>AI-detected blind spots, pattern matches, and behavioral flags.</p>
        </div>

        <div className="flex items-center p-1 rounded-xl border" style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
          <button
            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
            style={!showRead ? { background: "#1c1c1c", color: "#fff" } : { color: "#444" }}
            onClick={() => setShowRead(false)}
          >
            Unread
          </button>
          <button
            className="px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
            style={showRead ? { background: "#1c1c1c", color: "#fff" } : { color: "#444" }}
            onClick={() => setShowRead(true)}
          >
            All Alerts
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" style={{ background: "#111" }} />)}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
            return (
              <Link key={alert.id} href={alert.decisionId ? `/decisions/${alert.decisionId}` : "#"}>
                <div className="group relative rounded-2xl border overflow-hidden transition-all hover:border-white/10 cursor-pointer"
                  style={{ background: "#0a0a0a", borderColor: alert.isRead ? "#141414" : sev.border }}>

                  {/* Left accent bar for unread */}
                  {!alert.isRead && (
                    <div className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl" style={{ background: sev.color }} />
                  )}

                  <div className="p-5 pl-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                      <ShieldAlert className="w-4.5 h-4.5" style={{ color: sev.color, width: 18, height: 18 }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                          {sev.label} Severity
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(220,38,38,0.06)", color: "#888", border: "1px solid #222" }}>
                          {TYPE_LABELS[alert.alertType] || alert.alertType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] flex items-center gap-1" style={{ color: "#2a2a2a" }}>
                          <Clock className="w-3 h-3" />
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-bold text-white leading-snug mb-1 group-hover:text-red-400 transition-colors">
                        {alert.title}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: "#444" }}>
                        {alert.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!alert.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(alert.id, e)}
                          disabled={markReadMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
                          style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Read
                        </button>
                      )}
                      {alert.decisionId && (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all opacity-0 group-hover:opacity-100"
                          style={{ background: "#161616", color: "#666", border: "1px solid #222" }}>
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border text-center"
          style={{ background: "#0a0a0a", borderColor: "#141414" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)" }}>
            <Bell className="w-6 h-6" style={{ color: "#22c55e" }} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">All clear</h3>
          <p className="text-sm max-w-xs" style={{ color: "#333" }}>
            {showRead ? "No alerts in your history." : "No unread alerts. Your decision patterns look healthy."}
          </p>
        </div>
      )}
    </div>
  );
}

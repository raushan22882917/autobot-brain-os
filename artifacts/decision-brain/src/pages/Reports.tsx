import { useState } from "react";
import { useListReports, useGenerateReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Calendar, Sparkles, Download, Users, BarChart3, Clock } from "lucide-react";

const REPORT_TYPES: Record<string, { label: string; desc: string; icon: any; color: string; bg: string }> = {
  board_briefing:    { label: "Board Briefing",     desc: "C-suite ready executive summary", icon: Users,    color: "#a78bfa", bg: "rgba(124,58,237,0.08)"  },
  weekly:            { label: "Weekly Digest",      desc: "7-day decision activity summary", icon: Clock,    color: "#22c55e", bg: "rgba(34,197,94,0.08)"   },
  pattern_analysis:  { label: "Pattern Analysis",   desc: "Behavioral patterns deep-dive",  icon: BarChart3, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
};

export default function Reports() {
  const { data: reports, isLoading } = useListReports();
  const generateMutation = (useGenerateReport as any)();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("board_briefing");

  const handleGenerate = () => {
    generateMutation.mutate({ data: { reportType, decisionIds: [] } }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Reports</h1>
          <p className="text-sm mt-1" style={{ color: "#444" }}>AI-synthesized briefs for boards, stakeholders, and review.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)", boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}>
              <Plus className="w-4 h-4" />
              Generate Report
            </button>
          </DialogTrigger>
          <DialogContent className="border text-white sm:max-w-[440px]" style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                Generate AI Report
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-3">
                {Object.entries(REPORT_TYPES).map(([key, cfg]) => (
                  <button key={key} onClick={() => setReportType(key)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: reportType === key ? cfg.bg : "#0a0a0a",
                      borderColor: reportType === key ? `${cfg.color}40` : "#1e1e1e",
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      <cfg.icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{cfg.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#444" }}>{cfg.desc}</p>
                    </div>
                    {reportType === key && (
                      <div className="ml-auto w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={generateMutation.isPending}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
                {generateMutation.isPending ? (
                  <><Sparkles className="w-4 h-4 animate-pulse" /> Generating AI Report…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Report</>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" style={{ background: "#111" }} />)}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report: any) => {
            const cfg = REPORT_TYPES[report.reportType] ?? REPORT_TYPES.board_briefing;
            return (
              <div key={report.id} className="group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-white/10"
                style={{ background: "#0a0a0a", borderColor: "#141414" }}>
                <div className="h-1.5" style={{ background: cfg.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                      <cfg.icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#161616" }}>
                      <Download className="w-3.5 h-3.5" style={{ color: "#666" }} />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                  <h3 className="text-[14px] font-bold text-white leading-snug mb-3 line-clamp-2">
                    {report.title || "Intelligence Report"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#2a2a2a" }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border text-center"
          style={{ background: "#0a0a0a", borderColor: "#141414" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.12)" }}>
            <FileText className="w-6 h-6" style={{ color: "#DC2626" }} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No reports generated</h3>
          <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: "#333" }}>
            Synthesize your decision history into AI-powered intelligence briefs for stakeholders.
          </p>
          <button onClick={() => setOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
            Generate First Report
          </button>
        </div>
      )}
    </div>
  );
}

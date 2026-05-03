import { useState } from "react";
import { Link } from "wouter";
import { useListDecisions, useCreateDecision, getListDecisionsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, ArrowRight, Tag, X, BrainCircuit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STAKES_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  low:      { label: "Low",      color: "#9ca3af", bg: "#ffffff08", border: "#ffffff15", dot: "#4b5563" },
  medium:   { label: "Medium",   color: "#a78bfa", bg: "#7c3aed10", border: "#7c3aed25", dot: "#7c3aed" },
  high:     { label: "High",     color: "#fbbf24", bg: "#f59e0b10", border: "#f59e0b25", dot: "#f59e0b" },
  critical: { label: "Critical", color: "#f87171", bg: "#dc262610", border: "#dc262630", dot: "#DC2626" },
};

const PLATFORM_LABELS: Record<string, string> = {
  gmail: "Gmail", meet: "Meet", zoom: "Zoom", slack: "Slack",
  teams: "Teams", notion: "Notion", outlook: "Outlook", docusign: "DocuSign", manual: "Manual",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  if (d > 30) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "Just now";
}

export default function Decisions() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stakesFilter, setStakesFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStakes, setNewStakes] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newExpectedOutcome, setNewExpectedOutcome] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  const { data: response, isLoading } = useListDecisions({
    search,
    stakes: stakesFilter === "all" ? undefined : stakesFilter as any,
    limit: 50,
  });
  const decisions = response?.decisions ?? [];
  const createMutation = (useCreateDecision as any)();

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      data: {
        title: newTitle,
        description: [newDesc, newExpectedOutcome ? `Expected outcome: ${newExpectedOutcome}` : ""].filter(Boolean).join("\n\n"),
        stakes: newStakes,
        tags: newTags,
        sourcePlatform: "manual",
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setNewTitle(""); setNewDesc(""); setNewStakes("medium");
        setNewExpectedOutcome(""); setNewTags([]); setTagInput("");
        queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey({ search, limit: 50 }) });
        toast({ title: "Decision logged", description: "Added to your decision intelligence." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to log decision.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Decision Log</h1>
          <p className="text-sm mt-1" style={{ color: "#444" }}>Your complete history of recorded decisions.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)", boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}>
              <Plus className="w-4 h-4" />
              Log Decision
            </button>
          </DialogTrigger>
          <DialogContent className="border text-white sm:max-w-[520px]" style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-white">Log New Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>Decision Title *</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g., Hire VP of Engineering at $320K base"
                  className="border text-white h-11" style={{ background: "#0a0a0a", borderColor: "#222" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>Context & Reasoning</label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Why was this decision made? What factors influenced it?"
                  className="border text-white resize-none h-20" style={{ background: "#0a0a0a", borderColor: "#222" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>Expected Outcome</label>
                <Input value={newExpectedOutcome} onChange={(e) => setNewExpectedOutcome(e.target.value)}
                  placeholder="E.g., Engineering velocity 2x within 90 days"
                  className="border text-white h-11" style={{ background: "#0a0a0a", borderColor: "#222" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>Stakes Level</label>
                <Select value={newStakes} onValueChange={(val: any) => setNewStakes(val)}>
                  <SelectTrigger className="border text-white h-11" style={{ background: "#0a0a0a", borderColor: "#222" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#0d0d0d", borderColor: "#222" }} className="text-white">
                    <SelectItem value="low">Low — Easily reversible</SelectItem>
                    <SelectItem value="medium">Medium — Some impact</SelectItem>
                    <SelectItem value="high">High — Significant consequences</SelectItem>
                    <SelectItem value="critical">Critical — Irreversible or existential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>Tags</label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="hiring, strategy, finance…"
                    className="border text-white flex-1 h-11" style={{ background: "#0a0a0a", borderColor: "#222" }} />
                  <button onClick={addTag} className="px-3 rounded-xl border text-white/60 hover:text-white transition-colors"
                    style={{ background: "#0a0a0a", borderColor: "#222" }}>
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>
                {newTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newTags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                        {t}
                        <button onClick={() => setNewTags((prev) => prev.filter((x) => x !== t))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleCreate} disabled={!newTitle.trim() || createMutation.isPending}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
                {createMutation.isPending ? "Logging…" : "Log Decision"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#333" }} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions, context, tags…"
            className="pl-10 border text-white h-10" style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }} />
        </div>
        <Select value={stakesFilter} onValueChange={setStakesFilter}>
          <SelectTrigger className="w-38 border text-white h-10 gap-2" style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
            <Filter className="w-3.5 h-3.5" style={{ color: "#444" }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }} className="text-white">
            <SelectItem value="all">All Stakes</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        {decisions.length > 0 && (
          <span className="text-xs font-semibold ml-auto" style={{ color: "#333" }}>
            {decisions.length} record{decisions.length !== 1 ? "s" : ""}
          </span>
        )}

      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" style={{ background: "#111" }} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.map((decision: any) => {
            const sc = STAKES_CONFIG[decision.stakes] ?? STAKES_CONFIG.medium;
            return (
              <Link key={decision.id} href={`/decisions/${decision.id}`}>
                <div className="group relative rounded-2xl border overflow-hidden transition-all cursor-pointer hover:border-white/10"
                  style={{ background: "#0a0a0a", borderColor: "#141414" }}>
                  <div className="absolute left-0 inset-y-0 w-[3px]" style={{ background: sc.dot }} />
                  <div className="p-5 pl-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {sc.label}
                        </span>
                        {decision.sourcePlatform && decision.sourcePlatform !== "manual" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: "#ffffff06", color: "#444", border: "1px solid #1e1e1e" }}>
                            {PLATFORM_LABELS[decision.sourcePlatform] ?? decision.sourcePlatform}
                          </span>
                        )}
                        {decision.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#888", border: "1px solid #1e1e1e" }}>
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
                          {timeAgo(decision.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-bold text-white truncate group-hover:text-red-400 transition-colors">
                        {decision.title}
                      </h3>
                      {decision.description && (
                        <p className="text-xs mt-1 truncate leading-relaxed" style={{ color: "#333" }}>
                          {decision.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      {decision.outcomeScore !== undefined && decision.outcomeScore !== null && (
                        <div className="text-center">
                          <p className="text-[10px] font-medium mb-0.5" style={{ color: "#333" }}>Score</p>
                          <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{decision.outcomeScore}</p>
                        </div>
                      )}
                      {decision.alertCount > 0 && (
                        <div className="text-center">
                          <p className="text-[10px] font-medium mb-0.5" style={{ color: "#333" }}>Alerts</p>
                          <p className="text-xl font-bold" style={{ color: "#f59e0b" }}>{decision.alertCount}</p>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" style={{ color: "#DC2626" }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {decisions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border text-center"
              style={{ background: "#0a0a0a", borderColor: "#141414" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <BrainCircuit className="w-6 h-6" style={{ color: "#DC2626" }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No decisions found</h3>
              <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: "#333" }}>
                {search ? "No decisions match your search. Try different keywords." :
                  "Start building your decision intelligence by logging your first decision."}
              </p>
              {!search && (
                <button onClick={() => setOpen(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
                  Log your first decision
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Bug,
  Layers,
  TrendingUp,
  User,
  X,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Issue = {
  key: string;
  url: string;
  summary: string;
  status: string;
  statusCategory: string;
  type: string;
  priority: string;
  assignee: { name: string; email: string; avatar: string | null } | null;
  labels: string[];
  created: string;
  updated: string;
  description: string | null;
  commentCount: number;
};

type Summary = {
  configured: boolean;
  projectKey: string;
  jiraUrl: string;
  stats: { todo: number; inProgress: number; done: number; openBugs: number };
  recentIssues: Issue[];
  openBugs: Issue[];
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "new":        { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", dot: "#64748b" },
  "indeterminate": { bg: "rgba(234,179,8,0.1)", text: "#fbbf24", dot: "#fbbf24" },
  "done":       { bg: "rgba(34,197,94,0.1)",  text: "#4ade80", dot: "#22c55e" },
  "undefined":  { bg: "rgba(100,116,139,0.1)", text: "#64748b", dot: "#374151" },
};

const PRIORITY_COLORS: Record<string, string> = {
  Highest: "#ef4444",
  High:    "#f97316",
  Medium:  "#eab308",
  Low:     "#3b82f6",
  Lowest:  "#6b7280",
};

function StatusBadge({ status, category }: { status: string; category: string }) {
  const colors = STATUS_COLORS[category] ?? STATUS_COLORS["undefined"];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: colors.bg, color: colors.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
      {status}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: PRIORITY_COLORS[priority] ?? "#666" }}>
      <span className="w-2 h-2 rounded-sm" style={{ background: PRIORITY_COLORS[priority] ?? "#666" }} />
      {priority}
    </span>
  );
}

function NotConfiguredState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Layers className="w-10 h-10" style={{ color: "#333" }} />
      </div>
      <h2 className="text-white font-bold text-2xl mb-3">Jira Not Connected</h2>
      <p className="text-base max-w-md mb-8" style={{ color: "#555" }}>
        Connect your Jira workspace to track developer work, sprint progress, and bug status from the founder dashboard.
      </p>
      <div className="w-full max-w-md rounded-2xl p-6 text-left border space-y-4"
        style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: "#DC2626" }} />
          Setup Instructions
        </h3>
        <div className="space-y-3 text-sm" style={{ color: "#555" }}>
          {[
            { step: 1, text: "Go to id.atlassian.com → Manage Profile → Security → API Tokens" },
            { step: 2, text: "Create a new API token and copy it" },
            { step: 3, text: "Add these environment secrets to your Replit project:" },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3">
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626" }}>{step}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 font-mono text-[11px] space-y-1.5"
          style={{ background: "#060606", border: "1px solid #1a1a1a", color: "#DC2626" }}>
          <div><span style={{ color: "#555" }}>JIRA_URL</span>=https://yourcompany.atlassian.net</div>
          <div><span style={{ color: "#555" }}>JIRA_EMAIL</span>=founder@yourcompany.com</div>
          <div><span style={{ color: "#555" }}>JIRA_API_TOKEN</span>=ATATxxxxxxxx</div>
          <div><span style={{ color: "#555" }}>JIRA_PROJECT_KEY</span>=DB</div>
        </div>
      </div>
    </div>
  );
}

export default function JiraBoard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("");
  const [activeType, setActiveType] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newIssue, setNewIssue] = useState({ summary: "", description: "", type: "Task", priority: "Medium" });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [transitions, setTransitions] = useState<{ id: string; name: string; to: string }[]>([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [showTransitions, setShowTransitions] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/jira/summary", { credentials: "include" });
      const data = await res.json() as any;
      if (!res.ok || !data.configured) { setConfigured(false); return; }
      setSummary(data);
      setConfigured(true);
    } catch { setConfigured(false); }
  }, []);

  const fetchIssues = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeStatus) params.set("status", activeStatus);
      if (activeType) params.set("type", activeType);
      const res = await fetch(`/api/jira/issues?${params}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json() as any;
      setIssues(data.issues ?? []);
    } catch {}
  }, [activeStatus, activeType]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchIssues()]).finally(() => setLoading(false));
  }, [fetchSummary, fetchIssues]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchIssues()]);
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Jira data updated." });
  };

  const handleCreateIssue = async () => {
    if (!newIssue.summary.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/jira/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newIssue),
      });
      const data = await res.json() as any;
      if (res.ok) {
        toast({ title: `${data.key} created`, description: data.message });
        setShowCreate(false);
        setNewIssue({ summary: "", description: "", type: "Task", priority: "Medium" });
        fetchIssues();
        fetchSummary();
      } else {
        toast({ title: "Failed to create", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchTransitions = async (key: string) => {
    const res = await fetch(`/api/jira/transitions/${key}`, { credentials: "include" });
    const data = await res.json() as any;
    setTransitions(data.transitions ?? []);
    setShowTransitions(true);
  };

  const handleTransition = async (issueKey: string, transitionName: string) => {
    setTransitionLoading(true);
    try {
      const res = await fetch(`/api/jira/issues/${issueKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: transitionName }),
      });
      if (res.ok) {
        toast({ title: "Status updated", description: `${issueKey} moved to ${transitionName}` });
        setShowTransitions(false);
        fetchIssues();
        fetchSummary();
      }
    } catch {} finally { setTransitionLoading(false); }
  };

  const handleAddComment = async () => {
    if (!selectedIssue || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/jira/issues/${selectedIssue.key}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: commentText }),
      });
      if (res.ok) {
        toast({ title: "Comment added" });
        setCommentText("");
      }
    } catch {} finally { setCommentLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: "#DC2626" }} />
          <p style={{ color: "#444" }}>Connecting to Jira...</p>
        </div>
      </div>
    );
  }

  if (!configured) return <NotConfiguredState />;

  const STAT_CARDS = [
    { label: "To Do", value: summary?.stats.todo ?? 0, icon: Clock, color: "#64748b" },
    { label: "In Progress", value: summary?.stats.inProgress ?? 0, icon: TrendingUp, color: "#fbbf24" },
    { label: "Done", value: summary?.stats.done ?? 0, icon: CheckCircle2, color: "#22c55e" },
    { label: "Open Bugs", value: summary?.stats.openBugs ?? 0, icon: Bug, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Developer Tracker</h1>
            <Badge className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5"
              style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)" }}>
              Founder View
            </Badge>
          </div>
          <p style={{ color: "#555" }} className="text-sm">
            Track developer progress · Project: <span className="text-white font-mono">{summary?.projectKey}</span>
            {summary?.jiraUrl && (
              <a href={summary.jiraUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 ml-2 hover:underline" style={{ color: "#DC2626" }}>
                Open Jira <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"
            className="border-border text-muted-foreground hover:text-white hover:border-white/20 flex items-center gap-1.5"
            onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm"
            className="flex items-center gap-1.5 font-semibold"
            style={{ background: "#DC2626", color: "white" }}
            onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: "#555" }}>{stat.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-4xl font-black text-white">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Open Bugs Alert */}
      {(summary?.openBugs?.length ?? 0) > 0 && (
        <div className="rounded-xl p-4 border flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm mb-2">{summary!.stats.openBugs} Open Bug{summary!.stats.openBugs !== 1 ? "s" : ""}</p>
            <div className="space-y-1.5">
              {summary!.openBugs.map((bug) => (
                <div key={bug.key} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{bug.key}</span>
                  <span className="text-white/70 truncate flex-1">{bug.summary}</span>
                  <span className="text-[11px] shrink-0" style={{ color: "#666" }}>{bug.assignee}</span>
                  {bug.url && (
                    <a href={bug.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3 h-3 text-white/30 hover:text-white" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters + Issue Table */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-white text-lg font-bold">All Issues</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4" style={{ color: "#444" }} />
            {["", "To Do", "In Progress", "Done"].map((s) => (
              <button key={s || "all"}
                onClick={() => setActiveStatus(s)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                style={activeStatus === s
                  ? { background: "rgba(220,38,38,0.15)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)" }
                  : { background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
                {s || "All"}
              </button>
            ))}
            {["", "Bug", "Task", "Story"].map((t) => (
              <button key={t || "type-all"}
                onClick={() => setActiveType(t)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                style={activeType === t
                  ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }
                  : { background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
                {t || "All Types"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-10 h-10 mb-3" style={{ color: "#222" }} />
              <p style={{ color: "#444" }} className="text-sm">No issues found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#111" }}>
              {issues.map((issue) => (
                <div key={issue.key}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => setSelectedIssue(selectedIssue?.key === issue.key ? null : issue)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-[11px] shrink-0 px-2 py-0.5 rounded"
                      style={{ background: "#111", color: "#444", border: "1px solid #1a1a1a" }}>
                      {issue.key}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
                        {issue.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <PriorityDot priority={issue.priority} />
                        {issue.type !== "Task" && (
                          <span className="text-[10px] px-1.5 rounded" style={{ background: "#111", color: "#555" }}>
                            {issue.type}
                          </span>
                        )}
                        {issue.commentCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: "#444" }}>
                            <MessageSquare className="w-3 h-3" />{issue.commentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={issue.status} category={issue.statusCategory} />
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#444" }}>
                      <User className="w-3 h-3" />
                      {issue.assignee?.name ?? "Unassigned"}
                    </div>
                    {issue.url && (
                      <a href={issue.url} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-white/30 hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: "#111", color: "#DC2626" }}>
                  {selectedIssue.key}
                </span>
                <StatusBadge status={selectedIssue.status} category={selectedIssue.statusCategory} />
              </div>
              <CardTitle className="text-white text-lg">{selectedIssue.summary}</CardTitle>
            </div>
            <button onClick={() => setSelectedIssue(null)} className="text-white/20 hover:text-white transition-colors ml-4">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs mb-1" style={{ color: "#444" }}>Type</p><p className="text-white">{selectedIssue.type}</p></div>
              <div><p className="text-xs mb-1" style={{ color: "#444" }}>Priority</p><PriorityDot priority={selectedIssue.priority} /></div>
              <div><p className="text-xs mb-1" style={{ color: "#444" }}>Assignee</p><p className="text-white">{selectedIssue.assignee?.name ?? "Unassigned"}</p></div>
              <div><p className="text-xs mb-1" style={{ color: "#444" }}>Updated</p><p className="text-white">{new Date(selectedIssue.updated).toLocaleDateString()}</p></div>
            </div>

            {selectedIssue.description && (
              <div>
                <p className="text-xs mb-2" style={{ color: "#444" }}>Description</p>
                <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{selectedIssue.description}</p>
              </div>
            )}

            {/* Transition Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchTransitions(selectedIssue.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                <RefreshCw className="w-3.5 h-3.5" />
                Change Status
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showTransitions && transitions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {transitions.map((t) => (
                    <button key={t.id}
                      onClick={() => handleTransition(selectedIssue.key, t.name)}
                      disabled={transitionLoading}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-white/10"
                      style={{ background: "#111", color: "#888", border: "1px solid #1a1a1a" }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <p className="text-xs" style={{ color: "#444" }}>Add Comment (as Founder)</p>
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment or instruction for the developer..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
                />
                <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim() || commentLoading}
                  style={{ background: "#DC2626", color: "white" }}>
                  {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Issue Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-lg rounded-2xl p-8 border relative"
            style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-white/20 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: "#DC2626" }} />
              Create Jira Issue
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#555" }}>Summary *</label>
                <input
                  value={newIssue.summary}
                  onChange={(e) => setNewIssue({ ...newIssue, summary: e.target.value })}
                  placeholder="Brief description of the issue..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#555" }}>Description</label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Detailed description, acceptance criteria..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none resize-none"
                  style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: "#555" }}>Issue Type</label>
                  <select
                    value={newIssue.type}
                    onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                    {["Task", "Bug", "Story", "Epic"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: "#555" }}>Priority</label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                    {["Highest", "High", "Medium", "Low", "Lowest"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-border text-muted-foreground" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 font-semibold" style={{ background: "#DC2626", color: "white" }}
                  onClick={handleCreateIssue} disabled={!newIssue.summary.trim() || createLoading}>
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Issue"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

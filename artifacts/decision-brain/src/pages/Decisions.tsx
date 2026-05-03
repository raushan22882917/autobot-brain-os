import { useState } from "react";
import { Link } from "wouter";
import { useListDecisions, useCreateDecision, getListDecisionsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, ArrowRight, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STAKES_COLORS: Record<string, string> = {
  low:      "bg-white/10 text-white border-white/20",
  medium:   "bg-primary/20 text-primary border-primary/30",
  high:     "bg-amber-500/20 text-amber-500 border-amber-500/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const PLATFORM_LABELS: Record<string, string> = {
  gmail: "Gmail", meet: "Meet", zoom: "Zoom", slack: "Slack",
  teams: "Teams", notion: "Notion", outlook: "Outlook", docusign: "DocuSign", manual: "Manual",
};

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
        toast({ title: "Decision logged", description: "Added to your decision history." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to log decision.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Decision Log</h1>
          <p className="text-muted-foreground">Your complete history of recorded decisions.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Log Decision
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Log New Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Decision Title *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g., Acquired StartupX for $5M"
                  className="bg-input border-border text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Context & Reasoning</label>
                <Textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Why was this decision made? What factors influenced it?"
                  className="bg-input border-border text-white resize-none h-20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Expected Outcome</label>
                <Input
                  value={newExpectedOutcome}
                  onChange={(e) => setNewExpectedOutcome(e.target.value)}
                  placeholder="E.g., 3x revenue growth within 18 months"
                  className="bg-input border-border text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Stakes Level</label>
                <Select value={newStakes} onValueChange={(val: any) => setNewStakes(val)}>
                  <SelectTrigger className="bg-input border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-white">
                    <SelectItem value="low">Low — Easily reversible</SelectItem>
                    <SelectItem value="medium">Medium — Some impact</SelectItem>
                    <SelectItem value="high">High — Significant consequences</SelectItem>
                    <SelectItem value="critical">Critical — Irreversible or existential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="hiring, strategy, finance…"
                    className="bg-input border-border text-white flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={addTag} className="border-border text-white">
                    <Tag className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {newTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newTags.map((t) => (
                      <span key={t} className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full text-xs font-medium">
                        {t}
                        <button onClick={() => setNewTags((prev) => prev.filter((x) => x !== t))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createMutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                {createMutation.isPending ? "Logging…" : "Log Decision"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions, contexts, tags…"
            className="pl-10 bg-card border-border text-white"
          />
        </div>
        <Select value={stakesFilter} onValueChange={setStakesFilter}>
          <SelectTrigger className="w-36 bg-card border-border text-white">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-white">
            <SelectItem value="all">All Stakes</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {response?.decisions.map((decision: any) => (
            <Link key={decision.id} href={`/decisions/${decision.id}`}>
              <Card className="p-5 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className={STAKES_COLORS[decision.stakes] ?? STAKES_COLORS.medium}>
                      {decision.stakes.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(decision.createdAt).toLocaleDateString()}
                    </span>
                    {decision.sourcePlatform && (
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground">
                        {PLATFORM_LABELS[decision.sourcePlatform] ?? decision.sourcePlatform}
                      </span>
                    )}
                    {decision.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base font-bold text-white truncate group-hover:text-primary transition-colors">
                    {decision.title}
                  </h3>
                  {decision.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{decision.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  {decision.outcomeScore !== undefined && decision.outcomeScore !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Score</span>
                      <span className="text-lg font-bold text-emerald-500">{decision.outcomeScore}</span>
                    </div>
                  )}
                  {decision.alertCount > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Alerts</span>
                      <span className="text-lg font-bold text-amber-500">{decision.alertCount}</span>
                    </div>
                  )}
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 hidden sm:block" />
                </div>
              </Card>
            </Link>
          ))}

          {response?.decisions.length === 0 && (
            <div className="text-center py-20 bg-card border border-border rounded-xl">
              <h3 className="text-lg font-medium text-white mb-2">No decisions found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                {search ? "No decisions match your search. Try different keywords." : "Start building your decision intelligence by logging your first decision, or sync your connected accounts."}
              </p>
              {!search && (
                <button
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => setOpen(true)}
                >
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

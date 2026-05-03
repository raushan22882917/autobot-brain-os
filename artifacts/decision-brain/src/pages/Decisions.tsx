import { useState } from "react";
import { Link } from "wouter";
import { useListDecisions, useCreateDecision, getListDecisionsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Decisions() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStakes, setNewStakes] = useState<"low" | "medium" | "high" | "critical">("medium");

  const { data: response, isLoading } = useListDecisions({ search, limit: 50 });
  const createMutation = (useCreateDecision as any)(); // Adjust if correctly typed

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      data: {
        title: newTitle,
        description: newDesc,
        stakes: newStakes,
        sourcePlatform: "manual"
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewStakes("medium");
        queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey({ search, limit: 50 }) });
      }
    });
  };

  const getStakesColor = (stakes: string) => {
    switch (stakes) {
      case 'low': return 'bg-white/10 text-white border-white/20';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      case 'high': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
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
          <DialogContent className="bg-card border border-border text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Log New Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Decision Title</label>
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
                  placeholder="Explain why this decision was made..." 
                  className="bg-input border-border text-white resize-none h-24" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Stakes Level</label>
                <Select value={newStakes} onValueChange={(val: any) => setNewStakes(val)}>
                  <SelectTrigger className="bg-input border-border text-white">
                    <SelectValue placeholder="Select stakes" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={!newTitle.trim() || createMutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                {createMutation.isPending ? "Logging..." : "Log Decision"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions, contexts, tags..." 
            className="pl-10 bg-card border-border text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm text-white hover:bg-white/5 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
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
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={getStakesColor(decision.stakes)}>
                      {decision.stakes.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(decision.createdAt).toLocaleDateString()}
                    </span>
                    {decision.sourcePlatform && (
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground uppercase">
                        {decision.sourcePlatform}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                    {decision.title}
                  </h3>
                  {decision.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {decision.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-6">
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
              <p className="text-muted-foreground max-w-sm mx-auto">
                No decisions match your current search criteria. Try adjusting your filters or logging a new decision.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
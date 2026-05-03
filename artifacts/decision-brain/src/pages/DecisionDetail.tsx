import { useState } from "react";
import { useGetDecision, useGetSimilarDecisions, getGetDecisionQueryKey, getGetSimilarDecisionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, AlertTriangle, GitMerge, FileText } from "lucide-react";
import { Link, useParams } from "wouter";

export default function DecisionDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: decision, isLoading: isLoadingDecision } = useGetDecision(id || "", { 
    query: { enabled: !!id, queryKey: getGetDecisionQueryKey(id || "") } 
  });
  
  const { data: similarDecisions, isLoading: isLoadingSimilar } = useGetSimilarDecisions(id || "", {
    query: { enabled: !!id, queryKey: getGetSimilarDecisionsQueryKey(id || "") }
  });

  const getStakesColor = (stakes: string) => {
    switch (stakes) {
      case 'low': return 'bg-white/10 text-white border-white/20';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      case 'high': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'low': return 'bg-white/10 text-muted-foreground border-white/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  if (isLoadingDecision) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24 bg-white/5" />
        <Skeleton className="h-12 w-3/4 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 bg-white/5" />
            <Skeleton className="h-48 bg-white/5" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 bg-white/5" />
            <Skeleton className="h-48 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!decision) return <div>Decision not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/decisions">
          <button className="p-2 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={getStakesColor(decision.stakes)}>
            {decision.stakes.toUpperCase()} STAKES
          </Badge>
          <Badge variant="outline" className="bg-white/5 text-white border-white/10">
            {decision.status.toUpperCase()}
          </Badge>
          {decision.sourcePlatform && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
              via {decision.sourcePlatform}
            </Badge>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-2">
          {decision.title}
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          Recorded on {new Date(decision.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Context & Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {decision.description || "No context provided."}
              </div>
              {decision.rawContext && (
                <div className="mt-6 p-4 bg-black/40 rounded-lg border border-white/5 text-sm font-mono text-muted-foreground/80 overflow-auto">
                  <div className="text-xs font-sans text-muted-foreground mb-2">RAW EXTRACTED DATA</div>
                  {decision.rawContext}
                </div>
              )}
              {decision.tags && decision.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                  {decision.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Outcome Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decision.outcomes && decision.outcomes.length > 0 ? (
                <div className="space-y-4">
                  {decision.outcomes.map(outcome => (
                    <div key={outcome.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">Review ({outcome.checkInterval})</span>
                          <span className="text-xs text-muted-foreground">{new Date(outcome.trackedAt).toLocaleDateString()}</span>
                        </div>
                        {outcome.notes && <p className="text-sm text-muted-foreground">{outcome.notes}</p>}
                      </div>
                      <div className="text-2xl font-bold text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-md">
                        {outcome.score}
                        <span className="text-sm text-emerald-500/70 font-normal">/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No outcomes tracked yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Detected Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decision.alerts && decision.alerts.length > 0 ? (
                <div className="space-y-3">
                  {decision.alerts.map(alert => (
                    <div key={alert.id} className="p-3 rounded-md bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{alert.title}</span>
                        <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No alerts detected for this decision.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-primary" />
                Similar Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSimilar ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 bg-white/5" />)}
                </div>
              ) : similarDecisions && similarDecisions.length > 0 ? (
                <div className="space-y-3">
                  {similarDecisions.map(sim => (
                    <Link key={sim.id} href={`/decisions/${sim.id}`}>
                      <div className="p-3 rounded-md bg-white/5 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="text-sm font-medium text-white group-hover:text-primary transition-colors mb-1 truncate">
                          {sim.title}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{new Date(sim.createdAt).toLocaleDateString()}</span>
                          {sim.outcomeScore && <span className="text-emerald-500 font-medium">Score: {sim.outcomeScore}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No similar decisions found in history.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
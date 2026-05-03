import { useGetBlindspotAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EyeOff, AlertCircle, Clock, Database } from "lucide-react";

export default function Blindspots() {
  const { data: analytics, isLoading } = useGetBlindspotAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Blind Spot Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Areas of consistent vulnerability in your decision matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Urgency Bias Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.urgencyBiasCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Decisions made too quickly</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Information Deficit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.noExternalDataCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Lacking external validation</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Repeated Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{analytics.repeatedFailureCount}</div>
            <p className="text-xs text-destructive/70 mt-1">Similar context, poor outcomes</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Vulnerability Categories</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.categories.map((cat, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white capitalize">{cat.category.replace('_', ' ')}</CardTitle>
              <div className={`px-2.5 py-0.5 rounded text-xs font-bold bg-white/5 border border-white/10 ${getRiskColor(cat.riskLevel)}`}>
                {cat.riskLevel.toUpperCase()} RISK
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Occurrences</p>
                  <p className="text-2xl font-bold text-white">{cat.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Outcome Score</p>
                  <p className={`text-2xl font-bold ${cat.avgOutcomeScore < 50 ? 'text-destructive' : 'text-amber-500'}`}>
                    {cat.avgOutcomeScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
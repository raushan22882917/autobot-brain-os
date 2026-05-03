import { useGetPatternAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Network, Repeat, EyeOff, BrainCircuit, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Patterns() {
  const { data: analytics, isLoading } = useGetPatternAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 bg-white/5" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-white/5 mt-6" />
      </div>
    );
  }

  if (!analytics) return null;

  const chartData = Object.entries(analytics.patternsByType ?? {}).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const aiInsights = (analytics as any).aiInsights as string[] | undefined;
  const decisionCount = (analytics as any).decisionCount as number | undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Pattern Analytics</h1>
        <p className="text-muted-foreground mt-2">Macro-level analysis of your decision-making behaviors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Total Patterns Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{analytics.totalPatterns}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Repeat className="w-4 h-4 text-amber-500" />
              Repeated Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-500">{analytics.repeatMistakes}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-destructive" />
              Identified Blind Spots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">{analytics.blindSpots}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && aiInsights.length > 0 ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI-Detected Behavioral Patterns
            </CardTitle>
            <CardDescription>Gemini analysis of your {decisionCount} decisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-white/90 leading-relaxed">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : decisionCount !== undefined && decisionCount < 3 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <BrainCircuit className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Not enough data for AI analysis</p>
            <p className="text-muted-foreground text-sm">Log at least 3 decisions or sync your accounts to unlock pattern detection.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Pattern Distribution</CardTitle>
            <CardDescription>Frequency of different pattern types from alerts</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.6)" }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "hsl(0,0%,5%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                  <Bar dataKey="value" fill="hsl(0,84%,47%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No pattern data yet — sync your accounts to begin detection.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border overflow-hidden flex flex-col">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-white text-lg">Recent Discoveries</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {analytics.recentPatterns && analytics.recentPatterns.length > 0 ? (
              <div className="divide-y divide-border">
                {analytics.recentPatterns.map((pattern: any) => (
                  <div key={pattern.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                        {pattern.alertType.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(pattern.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1 line-clamp-1">{pattern.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pattern.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent patterns discovered yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useGetPatternAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Network, Repeat, EyeOff } from "lucide-react";
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

  const chartData = Object.entries(analytics.patternsByType).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Pattern Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Macro-level analysis of your decision-making behaviors.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Pattern Distribution</CardTitle>
            <CardDescription>Frequency of different pattern types</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.6)' }}
                />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(222, 47%, 7%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="hsl(245, 80%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                        {pattern.alertType.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pattern.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1 line-clamp-1">{pattern.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pattern.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent patterns discovered.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
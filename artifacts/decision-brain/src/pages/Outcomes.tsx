import { useGetPendingOutcomes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Outcomes() {
  const { data: pendingOutcomes, isLoading } = useGetPendingOutcomes();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Outcome Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Review the real-world results of your past decisions.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Pending Reviews
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 bg-white/5" />)}
          </div>
        ) : pendingOutcomes && pendingOutcomes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOutcomes.map((pending, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-base text-white line-clamp-2 leading-tight">
                      {pending.decision.title}
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">
                      {pending.checkInterval} Review
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      Due: {new Date(pending.dueAt).toLocaleDateString()}
                    </span>
                    <Link href={`/decisions/${pending.decision.id}`}>
                      <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                        Log Score
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">You're all caught up</h3>
            <p className="text-muted-foreground">No pending outcomes require your review at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
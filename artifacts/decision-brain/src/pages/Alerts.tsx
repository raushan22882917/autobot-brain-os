import { useState } from "react";
import { useListAlerts, useMarkAlertRead, getListAlertsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Alerts() {
  const [showRead, setShowRead] = useState(false);
  const { data: alerts, isLoading } = useListAlerts({ unread: !showRead });
  // We need to type the generated hook here if possible, but we'll use `any` for simplicity if not exported.
  const markReadMutation = (useMarkAlertRead as any)(); 

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ unread: true }) });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ unread: false }) });
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'low': return 'bg-white/10 text-muted-foreground border-white/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Active Alerts</h1>
          <p className="text-muted-foreground mt-2">
            AI-detected blind spots, pattern matches, and repeated mistakes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-md">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${!showRead ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            onClick={() => setShowRead(false)}
          >
            Unread
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${showRead ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            onClick={() => setShowRead(true)}
          >
            All
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5" />)}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="grid gap-3">
          {alerts.map((alert: any) => (
            <Link key={alert.id} href={alert.decisionId ? `/decisions/${alert.decisionId}` : "#"}>
              <Card className={`bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group ${!alert.isRead ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                        {alert.alertType.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!alert.isRead && (
                      <button 
                        onClick={(e) => handleMarkRead(alert.id, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 text-muted-foreground rounded-md text-sm font-medium transition-colors"
                        disabled={markReadMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Read
                      </button>
                    )}
                    {alert.decisionId && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4" />
                        View Decision
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No alerts</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            You have no {showRead ? '' : 'unread '}alerts at this time.
          </p>
        </div>
      )}
    </div>
  );
}
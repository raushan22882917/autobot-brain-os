import { useListIntegrations, useConnectIntegration, useDisconnectIntegration } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { getListIntegrationsQueryKey } from "@workspace/api-client-react";
import { 
  SiGmail, 
  SiZoom, 
  SiSlack, 
  SiNotion, 
} from "react-icons/si";
import { Mail, RefreshCw, FileSignature, Video, Users } from "lucide-react";

export default function Integrations() {
  const { data: integrations, isLoading } = useListIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();

  const getPlatformIcon = (platform: string) => {
    const iconClass = "w-8 h-8";
    switch (platform) {
      case 'gmail': return <SiGmail className={`${iconClass} text-red-500`} />;
      case 'zoom': return <SiZoom className={`${iconClass} text-blue-500`} />;
      case 'slack': return <SiSlack className={`${iconClass} text-purple-500`} />;
      case 'meet': return <Video className={`${iconClass} text-green-500`} />;
      case 'teams': return <Users className={`${iconClass} text-indigo-500`} />;
      case 'notion': return <SiNotion className={`${iconClass} text-white`} />;
      case 'docusign': return <FileSignature className={`${iconClass} text-blue-600`} />;
      case 'outlook': return <Mail className={`${iconClass} text-sky-500`} />;
      default: return <div className={`${iconClass} bg-muted rounded-md`} />;
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      gmail: "Gmail", zoom: "Zoom", slack: "Slack", meet: "Google Meet",
      teams: "Microsoft Teams", notion: "Notion", docusign: "DocuSign", outlook: "Outlook"
    };
    return names[platform] || platform;
  };

  const handleConnect = (platform: string) => {
    connectMutation.mutate({ platform }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
      }
    });
  };

  const handleDisconnect = (platform: string) => {
    disconnectMutation.mutate({ platform }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 bg-white/5 mb-2" />
          <Skeleton className="h-5 w-96 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 bg-white/5" />)}
        </div>
      </div>
    );
  }

  // Pre-define all platforms we want to show, even if not returned from API yet
  const ALL_PLATFORMS = ['gmail', 'zoom', 'slack', 'meet', 'teams', 'notion', 'outlook', 'docusign'];
  
  // Merge API data with predefined platforms
  const displayIntegrations = ALL_PLATFORMS.map(platform => {
    const existing = integrations?.find(i => i.platform === platform);
    return existing || { platform, status: 'disconnected', id: null };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Sources</h1>
        <p className="text-muted-foreground mt-2">
          Connect your communication and collaboration platforms to enable silent decision capture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayIntegrations.map((integration: any) => {
          const isConnected = integration.status === 'connected';
          const isPending = connectMutation.isPending || disconnectMutation.isPending;

          return (
            <Card key={integration.platform} className="bg-card border-border hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  {getPlatformIcon(integration.platform)}
                </div>
                {isConnected ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
                ) : (
                  <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10">Disconnected</Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <CardTitle className="text-xl font-bold text-white mb-1">
                  {getPlatformName(integration.platform)}
                </CardTitle>
                <CardDescription className="text-sm">
                  Automatically extracts commitments, next steps, and strategic choices.
                </CardDescription>
                
                <div className="mt-auto pt-6 flex items-center justify-between">
                  {isConnected && integration.lastSyncedAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3" />
                      {new Date(integration.lastSyncedAt).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="ml-auto">
                    {isConnected ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-border text-muted-foreground hover:text-white hover:bg-destructive/20 hover:border-destructive/50"
                        onClick={() => handleDisconnect(integration.platform)}
                        disabled={isPending}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleConnect(integration.platform)}
                        disabled={isPending}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
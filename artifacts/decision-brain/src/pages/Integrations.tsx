import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListIntegrations, useDisconnectIntegration } from "@workspace/api-client-react";
import { getListIntegrationsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  SiGmail,
  SiZoom,
  SiSlack,
  SiNotion,
} from "react-icons/si";
import { Mail, RefreshCw, FileSignature, Video, Users, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

const GOOGLE_PLATFORMS = ["gmail", "meet"];

const PLATFORM_META: Record<string, { name: string; desc: string }> = {
  gmail:    { name: "Gmail",             desc: "Capture commitments and decisions from email threads automatically." },
  meet:     { name: "Google Meet",       desc: "Extract action items and decisions from meeting transcripts." },
  zoom:     { name: "Zoom",              desc: "Automatically pull decisions from Zoom meeting recordings." },
  slack:    { name: "Slack",             desc: "Monitor channels for strategic decisions and commitments." },
  teams:    { name: "Microsoft Teams",   desc: "Extract decisions from Teams conversations and meetings." },
  notion:   { name: "Notion",            desc: "Sync decisions logged in Notion pages and databases." },
  outlook:  { name: "Outlook",           desc: "Capture decisions and commitments from Outlook email." },
  docusign: { name: "DocuSign",          desc: "Track signed agreements and contractual decisions." },
};

export default function Integrations() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { data: integrations, isLoading } = useListIntegrations();
  const disconnectMutation = useDisconnectIntegration();

  // Show success/error toasts from OAuth redirect query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const integrationError = params.get("integration_error");

    if (connected) {
      const name = PLATFORM_META[connected]?.name ?? connected;
      toast({ title: `${name} connected`, description: "Your account has been linked successfully." });
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
      queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
    }
    if (integrationError) {
      const messages: Record<string, string> = {
        access_denied: "You declined the Google permission request.",
        missing_params: "OAuth response was incomplete. Please try again.",
        invalid_state: "Security check failed. Please try again.",
        not_configured: "Google OAuth is not configured on the server.",
        token_exchange_failed: "Could not exchange auth code for tokens.",
        callback_failed: "An unexpected error occurred. Please try again.",
      };
      toast({
        title: "Connection failed",
        description: messages[integrationError] ?? "An error occurred.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location]);

  const getPlatformIcon = (platform: string) => {
    const cls = "w-8 h-8";
    switch (platform) {
      case "gmail":    return <SiGmail className={`${cls} text-red-500`} />;
      case "zoom":     return <SiZoom className={`${cls} text-blue-500`} />;
      case "slack":    return <SiSlack className={`${cls} text-purple-500`} />;
      case "meet":     return <Video className={`${cls} text-green-500`} />;
      case "teams":    return <Users className={`${cls} text-indigo-500`} />;
      case "notion":   return <SiNotion className={`${cls} text-white`} />;
      case "docusign": return <FileSignature className={`${cls} text-blue-600`} />;
      case "outlook":  return <Mail className={`${cls} text-sky-500`} />;
      default:         return <div className={`${cls} bg-muted rounded-md`} />;
    }
  };

  const handleGoogleConnect = (platform: string) => {
    // Redirect to the backend OAuth start endpoint
    window.location.href = `/api/integrations/google/auth?platform=${platform}`;
  };

  const handleDisconnect = (platform: string) => {
    disconnectMutation.mutate({ platform }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        const name = PLATFORM_META[platform]?.name ?? platform;
        toast({ title: `${name} disconnected`, description: "Integration removed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to disconnect. Please try again.", variant: "destructive" });
      },
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
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 bg-white/5" />)}
        </div>
      </div>
    );
  }

  const ALL_PLATFORMS = ["gmail", "meet", "zoom", "slack", "teams", "notion", "outlook", "docusign"];

  const displayIntegrations = ALL_PLATFORMS.map(platform => {
    const existing = integrations?.find((i: any) => i.platform === platform);
    return existing ?? { platform, status: "disconnected", id: null };
  });

  const connectedCount = displayIntegrations.filter((i: any) => i.status === "connected").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Sources</h1>
          <p className="text-muted-foreground mt-2">
            Connect your platforms to enable silent decision capture.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-white">{connectedCount} of {ALL_PLATFORMS.length} connected</span>
        </div>
      </div>

      {/* Google OAuth notice */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          <span className="text-white font-medium">Gmail and Google Meet</span> use real Google OAuth — your account will be asked to grant read-only access. All other platforms use simulated connections for demo purposes.
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayIntegrations.map((integration: any) => {
          const isConnected = integration.status === "connected";
          const isGoogle = GOOGLE_PLATFORMS.includes(integration.platform);
          const meta = PLATFORM_META[integration.platform] ?? { name: integration.platform, desc: "" };

          return (
            <Card
              key={integration.platform}
              className={`bg-card flex flex-col transition-colors ${
                isConnected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  {getPlatformIcon(integration.platform)}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {isConnected ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10">
                      Disconnected
                    </Badge>
                  )}
                  {isGoogle && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                      Google OAuth
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col pt-4">
                <CardTitle className="text-xl font-bold text-white mb-1">{meta.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{meta.desc}</CardDescription>

                <div className="mt-auto pt-6 flex items-center justify-between">
                  {isConnected && integration.lastSyncedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                        disabled={disconnectMutation.isPending}
                      >
                        Disconnect
                      </Button>
                    ) : isGoogle ? (
                      <Button
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-gray-100 flex items-center gap-2 font-medium"
                        onClick={() => handleGoogleConnect(integration.platform)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                        onClick={() => {
                          // Simulate connect for non-OAuth platforms
                          fetch(`/api/integrations/${integration.platform}/connect`, { method: "POST", credentials: "include" })
                            .then(() => queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() }));
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
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

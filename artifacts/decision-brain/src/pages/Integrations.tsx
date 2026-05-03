import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useListIntegrations, useDisconnectIntegration } from "@workspace/api-client-react";
import { getListIntegrationsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/apiUrl";
import { SiGmail, SiZoom, SiSlack, SiNotion } from "react-icons/si";
import {
  Mail, RefreshCw, FileSignature, Video, Users, ExternalLink,
  CheckCircle2, Loader2, Zap, BookOpen, ChevronRight, ChevronDown,
  Shield, Clock, Plug, Info, ArrowRight, AlertCircle, Lock
} from "lucide-react";

const GOOGLE_PLATFORMS = ["gmail", "meet"];
const SYNC_PLATFORMS: Record<string, string> = { gmail: "gmail", meet: "meet" };

const PLATFORM_META: Record<string, {
  name: string;
  desc: string;
  category: string;
  color: string;
  guide: {
    overview: string;
    steps: string[];
    permissions: string[];
    dataCapture: string[];
    tips: string[];
    faq: { q: string; a: string }[];
  };
}> = {
  gmail: {
    name: "Gmail",
    desc: "Capture commitments and decisions from email threads automatically.",
    category: "Google Workspace",
    color: "#EA4335",
    guide: {
      overview: "Autobot360 connects to Gmail via Google OAuth to silently scan your inbox for decision signals — commitments you've made, approvals you've given, and key threads your team is waiting on.",
      steps: [
        "Click 'Sign in with Google' on the Gmail card.",
        "You'll be redirected to Google's secure authorization page.",
        "Sign in with the Google account whose Gmail you want to monitor.",
        "Grant the requested permissions (read-only access to Gmail messages).",
        "You'll be redirected back to Autobot360 with Gmail connected.",
        "Click 'Sync Now' to run your first scan — this may take 30–60 seconds.",
      ],
      permissions: [
        "Read-only access to Gmail messages (no write access)",
        "Access to email subjects, body, and sender metadata",
        "No ability to send, delete, or modify emails",
      ],
      dataCapture: [
        "Commitments made in email threads (e.g., 'I'll send that by Friday')",
        "Decisions confirmed over email (e.g., 'Let's go with Option B')",
        "Follow-up triggers and action items",
        "Key stakeholder communication patterns",
      ],
      tips: [
        "Sync at least once per week for best results.",
        "Decisions from threads older than 90 days are skipped by default.",
        "If you manage multiple Gmail accounts, connect each separately.",
      ],
      faq: [
        { q: "Can Autobot360 send emails on my behalf?", a: "No. We only request read-only Gmail access. We cannot compose, send, or delete any emails." },
        { q: "How far back does the initial sync go?", a: "The first sync scans the past 30 days of emails. Subsequent syncs only process new messages since the last sync." },
        { q: "What if I revoke access?", a: "You can disconnect Gmail at any time from this page. All previously captured data is retained but new syncs will stop." },
      ],
    },
  },
  meet: {
    name: "Google Meet",
    desc: "Extract action items and decisions from meeting transcripts.",
    category: "Google Workspace",
    color: "#34A853",
    guide: {
      overview: "Autobot360 reads Google Meet transcripts and recordings from your Google Drive to extract decisions made during meetings, action items assigned, and follow-up commitments.",
      steps: [
        "Click 'Sign in with Google' on the Google Meet card.",
        "Authorize Autobot360 to access your Google Drive (where Meet transcripts are saved).",
        "Enable auto-transcription in Google Meet settings for best results.",
        "Click 'Sync Now' after each meeting to pull in new transcripts.",
      ],
      permissions: [
        "Read-only access to Google Drive files (specifically Meet transcripts)",
        "Access to transcript text and meeting metadata (date, duration, participants)",
        "No access to video recordings themselves",
      ],
      dataCapture: [
        "Action items explicitly mentioned in meetings",
        "Decisions voted on or agreed to by the group",
        "Follow-up items with assigned owners and deadlines",
        "Meeting participants and attendance patterns",
      ],
      tips: [
        "Enable 'Transcripts' in your Google Meet settings before meetings start.",
        "Transcripts are saved to the meeting organizer's Drive — connect the organizer's account.",
        "Sync within 24 hours of a meeting for the most accurate AI extraction.",
      ],
      faq: [
        { q: "Does Autobot360 record my meetings?", a: "No. We only read transcripts that Google Meet has already generated and saved to Google Drive." },
        { q: "What if transcription wasn't enabled?", a: "Without a transcript, no data can be extracted. We recommend enabling auto-transcription in your Google Workspace admin settings." },
        { q: "Can I sync a specific meeting manually?", a: "Not yet — syncing processes all new transcripts since the last sync. Per-meeting sync is on our roadmap." },
      ],
    },
  },
  zoom: {
    name: "Zoom",
    desc: "Automatically pull decisions from Zoom meeting recordings.",
    category: "Video Conferencing",
    color: "#2D8CFF",
    guide: {
      overview: "Autobot360 connects to Zoom's cloud recording system to analyze meeting transcripts and extract decisions, action items, and strategic commitments discussed during calls.",
      steps: [
        "Click 'Connect' on the Zoom card.",
        "You'll be redirected to Zoom's OAuth authorization page.",
        "Sign in to Zoom and authorize Autobot360 to access your cloud recordings.",
        "Return to Autobot360 — Zoom will now sync automatically after each meeting.",
        "Alternatively, click 'Sync Now' to trigger an on-demand sync.",
      ],
      permissions: [
        "Access to Zoom cloud recording transcripts (not video files)",
        "Read-only access to meeting metadata (title, date, participants)",
        "No ability to schedule, start, or modify Zoom meetings",
      ],
      dataCapture: [
        "Decisions finalized during Zoom calls",
        "Action items with assigned owners",
        "Strategic discussions and consensus points",
        "Meeting frequency and participant engagement patterns",
      ],
      tips: [
        "Enable 'Audio Transcript' in Zoom Cloud Recording settings.",
        "Only cloud recordings generate transcripts — local recordings are not supported.",
        "Zoom Business or Pro plan is required for cloud recording.",
      ],
      faq: [
        { q: "Will Autobot360 access my Zoom video files?", a: "No. We only access transcript text files generated from cloud recordings, never the video or audio files themselves." },
        { q: "Does this work with Zoom Webinars?", a: "Yes, if the webinar has cloud recording with transcripts enabled." },
        { q: "What Zoom plan do I need?", a: "Cloud recordings require Zoom Business, Pro, or Enterprise plans." },
      ],
    },
  },
  slack: {
    name: "Slack",
    desc: "Monitor channels for strategic decisions and commitments.",
    category: "Messaging",
    color: "#4A154B",
    guide: {
      overview: "Autobot360 integrates with Slack to passively monitor selected channels for decision signals — threads where your team is debating options, approving requests, or making strategic calls.",
      steps: [
        "Click 'Connect' on the Slack card.",
        "You'll be redirected to Slack to install the Autobot360 app.",
        "Select the workspace and authorize the required permissions.",
        "Choose which channels to monitor (you can adjust this later).",
        "Autobot360 will begin scanning new messages for decision signals.",
      ],
      permissions: [
        "Read access to messages in channels where the app is installed",
        "Access to message text, timestamps, and author metadata",
        "No ability to post, delete, or modify messages",
        "No access to direct messages (DMs) by default",
      ],
      dataCapture: [
        "Channel decisions flagged with keywords (e.g., 'decided', 'approved', 'let's go with')",
        "Threads where team votes or reactions signal consensus",
        "Commitments made in public channels",
        "Decision turnaround time across channels",
      ],
      tips: [
        "Add the Autobot360 app to the channels most relevant to strategic decisions.",
        "Avoid adding it to social or off-topic channels to keep noise low.",
        "Use Slack emoji reactions (✅, 🚀) — Autobot360 understands them as decision signals.",
      ],
      faq: [
        { q: "Can Autobot360 read my private Slack channels?", a: "Only if you explicitly add the bot to a private channel. We never access channels where the app hasn't been invited." },
        { q: "Can Autobot360 read my DMs?", a: "No. We never access direct messages. Only channels where the app is installed are monitored." },
        { q: "Can I exclude specific channels?", a: "Yes — you can remove the Autobot360 app from any channel in Slack directly." },
      ],
    },
  },
  teams: {
    name: "Microsoft Teams",
    desc: "Extract decisions from Teams conversations and meetings.",
    category: "Microsoft 365",
    color: "#5059C9",
    guide: {
      overview: "Autobot360 connects to Microsoft Teams via Microsoft Graph API to read messages and meeting transcripts from selected channels, extracting strategic decisions and commitments.",
      steps: [
        "Click 'Connect' on the Microsoft Teams card.",
        "You'll be redirected to Microsoft's authorization page.",
        "Sign in with your Microsoft 365 account.",
        "Grant the required permissions for reading Teams channels and meetings.",
        "Select which Teams and channels to monitor.",
        "Click 'Sync Now' to begin processing recent conversations.",
      ],
      permissions: [
        "Read access to Teams channel messages",
        "Read access to Teams meeting transcripts",
        "Access to user profiles for participant identification",
        "No write permissions — Autobot360 never posts to Teams",
      ],
      dataCapture: [
        "Strategic decisions discussed in Teams channels",
        "Action items from Teams meetings",
        "Approval chains and sign-off confirmations",
        "Cross-team coordination decisions",
      ],
      tips: [
        "Enable meeting transcription in your Teams admin settings.",
        "Focus monitoring on project-specific channels for cleaner data.",
        "Microsoft 365 Business Standard or higher required.",
      ],
      faq: [
        { q: "Does this require admin approval in my Microsoft 365 tenant?", a: "Yes. An M365 admin may need to approve the Autobot360 app before users can connect." },
        { q: "Can Autobot360 post to Teams channels?", a: "No. We only read messages and transcripts — we never post or send any content to Teams." },
        { q: "Is personal Teams (free) supported?", a: "Currently only Microsoft 365 business accounts are supported." },
      ],
    },
  },
  notion: {
    name: "Notion",
    desc: "Sync decisions logged in Notion pages and databases.",
    category: "Productivity",
    color: "#FFFFFF",
    guide: {
      overview: "Autobot360 reads your Notion workspace to find decision logs, project pages, and databases where your team records strategic choices — then pulls them into your centralized decision OS.",
      steps: [
        "Click 'Connect' on the Notion card.",
        "You'll be redirected to Notion's OAuth authorization page.",
        "Select which pages and databases you want to share with Autobot360.",
        "Grant access and return to Autobot360.",
        "Autobot360 will scan the shared pages for decision content.",
      ],
      permissions: [
        "Read-only access to pages and databases you explicitly share",
        "No access to pages not shared during authorization",
        "No ability to create, edit, or delete Notion content",
      ],
      dataCapture: [
        "Decision log entries in Notion databases",
        "Meeting notes with outcome sections",
        "Project retrospectives and lessons learned",
        "OKRs, goals, and strategic planning pages",
      ],
      tips: [
        "Create a dedicated 'Decision Log' database in Notion and share it with Autobot360 for the cleanest extraction.",
        "Tag key decisions with a 'Decision' type in your database for better AI accuracy.",
        "Sync after major planning sessions or retrospectives.",
      ],
      faq: [
        { q: "Can Autobot360 edit my Notion pages?", a: "No. We only request read-only access to pages you share with us." },
        { q: "Can I choose which pages to share?", a: "Yes — during OAuth, Notion lets you select exactly which pages and databases to grant access to." },
        { q: "What if I share the wrong page by accident?", a: "Disconnect and reconnect Notion to re-select your pages, or revoke access directly in Notion's 'Connections' settings." },
      ],
    },
  },
  outlook: {
    name: "Outlook",
    desc: "Capture decisions and commitments from Outlook email.",
    category: "Microsoft 365",
    color: "#0078D4",
    guide: {
      overview: "Autobot360 connects to Microsoft Outlook via the Graph API to scan your inbox for decision signals — emails where you've approved something, committed to a deadline, or made a strategic call.",
      steps: [
        "Click 'Connect' on the Outlook card.",
        "Sign in with your Microsoft 365 account.",
        "Authorize read-only access to your Outlook mailbox.",
        "Return to Autobot360 — your inbox will be scanned for recent decisions.",
        "Click 'Sync Now' to pull in the latest emails.",
      ],
      permissions: [
        "Read-only access to Outlook emails",
        "Access to subject, body, sender, and recipient metadata",
        "Access to calendar events (meeting invites) for context",
        "No write access — cannot send, delete, or move emails",
      ],
      dataCapture: [
        "Approval emails and sign-off confirmations",
        "Deadline commitments made over email",
        "Vendor and partner decision threads",
        "Forwarded decisions requiring your acknowledgment",
      ],
      tips: [
        "Outlook and Gmail can both be connected if you use both.",
        "Shared mailboxes are not currently supported — connect individual accounts.",
        "Emails in your Sent folder are also scanned for commitments you've made.",
      ],
      faq: [
        { q: "Does this work with Exchange on-premise?", a: "Currently only Microsoft 365 cloud accounts are supported. On-premise Exchange support is on our roadmap." },
        { q: "Can Autobot360 send emails from my Outlook?", a: "No. We request read-only permissions and cannot send any emails." },
        { q: "Will my calendar be accessed?", a: "Calendar metadata (meeting titles and attendees) may be accessed to provide context for decisions, but never modified." },
      ],
    },
  },
  docusign: {
    name: "DocuSign",
    desc: "Track signed agreements and contractual decisions.",
    category: "Legal & Contracts",
    color: "#FFB600",
    guide: {
      overview: "Autobot360 connects to DocuSign to monitor completed envelopes — tracking contracts signed, agreements executed, and key legal decisions made. Every signed document represents a commitment worth capturing.",
      steps: [
        "Click 'Connect' on the DocuSign card.",
        "You'll be redirected to DocuSign's authorization page.",
        "Sign in with your DocuSign account.",
        "Authorize Autobot360 to read completed envelopes and documents.",
        "Return to Autobot360 — your recent signed documents will be indexed.",
      ],
      permissions: [
        "Read access to completed DocuSign envelopes",
        "Access to envelope metadata (parties, dates, document names)",
        "No access to document content unless you explicitly enable it",
        "No ability to create, send, or void envelopes",
      ],
      dataCapture: [
        "Contracts signed and parties involved",
        "Agreement execution dates and deadlines",
        "Renewal and expiry dates extracted from envelope metadata",
        "Vendor, partner, and employee agreement timelines",
      ],
      tips: [
        "Use DocuSign tags (envelope names) that describe the agreement type for better AI categorization.",
        "Connect the account used most for external partner agreements.",
        "Combine with Gmail/Outlook integration for full decision coverage of contract workflows.",
      ],
      faq: [
        { q: "Does Autobot360 read the content of my contracts?", a: "By default, only envelope metadata (names, dates, parties) is captured. Full document content extraction can be enabled in settings." },
        { q: "Can Autobot360 send or sign documents?", a: "No. We have read-only access to completed envelopes and cannot initiate any signing workflows." },
        { q: "Does this work with DocuSign CLM?", a: "Standard DocuSign eSignature is supported. CLM integration is on our roadmap." },
      ],
    },
  },
};

const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function getPlatformIcon(platform: string, size = "w-8 h-8") {
  switch (platform) {
    case "gmail":    return <SiGmail className={`${size} text-red-500`} />;
    case "zoom":     return <SiZoom className={`${size} text-blue-500`} />;
    case "slack":    return <SiSlack className={`${size} text-purple-400`} />;
    case "meet":     return <Video className={`${size} text-green-500`} />;
    case "teams":    return <Users className={`${size} text-indigo-400`} />;
    case "notion":   return <SiNotion className={`${size} text-white`} />;
    case "docusign": return <FileSignature className={`${size} text-yellow-500`} />;
    case "outlook":  return <Mail className={`${size} text-sky-500`} />;
    default:         return <div className={`${size} bg-muted rounded-md`} />;
  }
}

function GuideAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[13px] font-medium text-white/80">{q}</span>
        {open ? <ChevronDown className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[13px] text-white/50 leading-relaxed border-t border-white/8">
          {a}
        </div>
      )}
    </div>
  );
}

function GuidePanel({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  const { guide } = meta;
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-white/40" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Overview</span>
        </div>
        <p className="text-[14px] text-white/65 leading-relaxed">{guide.overview}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Setup Steps */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4" style={{ color: "#DC2626" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#DC2626" }}>Setup Steps</span>
          </div>
          <ol className="space-y-3">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                  style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)" }}>
                  {i + 1}
                </span>
                <span className="text-[13px] text-white/60 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* What we capture */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">Data Captured</span>
          </div>
          <ul className="space-y-2.5">
            {guide.dataCapture.map((item, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Permissions */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">Permissions Requested</span>
          </div>
          <ul className="space-y-2.5">
            {guide.permissions.map((perm, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <Shield className="w-4 h-4 text-blue-400/70 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60 leading-relaxed">{perm}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-500">Pro Tips</span>
          </div>
          <ul className="space-y-2.5">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="text-yellow-500/70 text-[11px] mt-1 shrink-0">→</span>
                <span className="text-[13px] text-white/60 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-white/30" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Frequently Asked Questions</span>
        </div>
        <div className="space-y-2">
          {guide.faq.map((item, i) => (
            <GuideAccordion key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Integrations() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { data: integrations, isLoading, refetch } = useListIntegrations();
  const disconnectMutation = useDisconnectIntegration();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"connect" | "guide">("connect");
  const [guideOpen, setGuideOpen] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const integrationError = params.get("integration_error");
    if (connected) {
      const name = PLATFORM_META[connected]?.name ?? connected;
      window.history.replaceState({}, "", window.location.pathname);
      queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
      refetch();
      toast({ title: `${name} connected`, description: "Your account has been linked. Click Sync Now to pull your data." });
    }
    if (integrationError) {
      const messages: Record<string, string> = {
        access_denied: "You declined the permission request.",
        missing_params: "OAuth response was incomplete. Please try again.",
        invalid_state: "Security check failed. Please try again.",
        not_configured: "Google OAuth is not configured on the server.",
        token_exchange_failed: "Could not exchange auth code for tokens.",
        callback_failed: "An unexpected error occurred. Please try again.",
      };
      window.history.replaceState({}, "", window.location.pathname);
      toast({ title: "Connection failed", description: messages[integrationError] ?? "An error occurred.", variant: "destructive" });
    }
  }, [location]);

  const handleGoogleConnect = (platform: string) => {
    window.location.href = apiUrl(`/integrations/google/auth?platform=${platform}`);
  };

  const handleSimpleConnect = async (platform: string) => {
    setConnectingPlatform(platform);
    try {
      const res = await fetch(apiUrl(`/integrations/${platform}/connect`), { method: "POST", credentials: "include" });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        await refetch();
        const name = PLATFORM_META[platform]?.name ?? platform;
        toast({ title: `${name} connected`, description: "Integration linked successfully." });
      } else {
        toast({ title: "Connection failed", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection failed", description: "Network error.", variant: "destructive" });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleSync = async (platform: string) => {
    const syncKey = SYNC_PLATFORMS[platform];
    if (!syncKey) return;
    setSyncingPlatform(platform);
    try {
      const res = await fetch(apiUrl(`/sync/${syncKey}`), { method: "POST", credentials: "include" });
      const data = await res.json() as any;
      if (res.ok) {
        await refetch();
        if (data.synced > 0) {
          toast({ title: `Sync complete`, description: `${data.synced} decision${data.synced !== 1 ? "s" : ""} extracted.` });
        } else {
          toast({ title: "Sync complete", description: "No new decisions found." });
        }
      } else {
        toast({ title: "Sync failed", description: data.error ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Sync failed", description: "Network error.", variant: "destructive" });
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleDisconnect = (platform: string) => {
    disconnectMutation.mutate({ platform }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        refetch();
        const name = PLATFORM_META[platform]?.name ?? platform;
        toast({ title: `${name} disconnected`, description: "Integration removed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
      },
    });
  };

  const ALL_PLATFORMS = ["gmail", "meet", "zoom", "slack", "teams", "notion", "outlook", "docusign"];
  const integrationsArray = Array.isArray(integrations) ? integrations : [];
  const displayIntegrations = ALL_PLATFORMS.map(platform => {
    const existing = integrationsArray.find((i: any) => i.platform === platform);
    return existing ?? { platform, status: "disconnected", id: null, lastSyncedAt: null };
  });
  const connectedCount = displayIntegrations.filter((i: any) => i.status === "connected").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Sources</h1>
          <p className="text-muted-foreground mt-2">Connect your platforms to enable silent decision capture.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-white">{connectedCount} of {ALL_PLATFORMS.length} connected</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 w-fit" style={{ background: "#0a0a0a" }}>
        {[
          { key: "connect", label: "Integrations", icon: Plug },
          { key: "guide", label: "Setup Guide & Docs", icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            style={activeTab === tab.key ? { background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.25)" } : {}}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Integrations Tab */}
      {activeTab === "connect" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayIntegrations.map((integration: any) => {
            const isConnected = integration.status === "connected";
            const isGoogle = GOOGLE_PLATFORMS.includes(integration.platform);
            const canSync = isConnected && SYNC_PLATFORMS[integration.platform];
            const isSyncing = syncingPlatform === integration.platform;
            const isConnecting = connectingPlatform === integration.platform;
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
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-white/10 text-white/30">{(meta as any).category}</span>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">{meta.desc}</CardDescription>
                  {isConnected && integration.lastSyncedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                      <Clock className="w-3 h-3" />
                      Last synced {new Date(integration.lastSyncedAt).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mt-auto pt-5 flex items-center gap-2 flex-wrap">
                    {isConnected ? (
                      <>
                        {canSync && (
                          <Button size="sm"
                            className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white flex items-center gap-1.5 flex-1"
                            onClick={() => handleSync(integration.platform)}
                            disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            {isSyncing ? "Syncing…" : "Sync Now"}
                          </Button>
                        )}
                        <Button variant="outline" size="sm"
                          className="border-border text-muted-foreground hover:text-white hover:bg-destructive/20 hover:border-destructive/50"
                          onClick={() => handleDisconnect(integration.platform)}
                          disabled={disconnectMutation.isPending}>
                          Disconnect
                        </Button>
                      </>
                    ) : isGoogle ? (
                      <Button size="sm"
                        className="bg-white text-gray-900 hover:bg-gray-100 flex items-center gap-2 font-medium w-full justify-center"
                        onClick={() => handleGoogleConnect(integration.platform)}>
                        <GoogleIcon />
                        Sign in with Google
                      </Button>
                    ) : (
                      <Button size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 w-full justify-center"
                        onClick={() => handleSimpleConnect(integration.platform)}
                        disabled={isConnecting}>
                        {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        {isConnecting ? "Connecting…" : "Connect"}
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => setGuideOpen(guideOpen === integration.platform ? null : integration.platform)}
                    className="mt-3 text-[11px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    {guideOpen === integration.platform ? "Hide guide" : "View setup guide"}
                  </button>
                  {guideOpen === integration.platform && (
                    <div className="mt-4 pt-4 border-t border-white/8">
                      <GuidePanel platform={integration.platform} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Guide Tab */}
      {activeTab === "guide" && (
        <div className="space-y-6">
          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_PLATFORMS.map(platform => {
              const meta = PLATFORM_META[platform];
              return (
                <button
                  key={platform}
                  onClick={() => setGuideOpen(guideOpen === platform ? null : platform)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all hover:border-white/20 ${
                    guideOpen === platform ? "border-white/20 bg-white/5" : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  {getPlatformIcon(platform, "w-5 h-5")}
                  <span className="text-[13px] font-medium text-white/70">{meta?.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected guide */}
          {guideOpen ? (
            <div className="rounded-2xl border border-white/10 p-6" style={{ background: "#0a0a0a" }}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
                {getPlatformIcon(guideOpen, "w-7 h-7")}
                <div>
                  <h2 className="text-xl font-bold text-white">{PLATFORM_META[guideOpen]?.name}</h2>
                  <p className="text-xs text-white/40">{(PLATFORM_META[guideOpen] as any)?.category}</p>
                </div>
              </div>
              <GuidePanel platform={guideOpen} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-10 h-10 text-white/15 mb-4" />
              <p className="text-white/40 text-sm">Select an integration above to view its setup guide and documentation.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

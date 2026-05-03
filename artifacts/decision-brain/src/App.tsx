import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Decisions from "@/pages/Decisions";
import DecisionDetail from "@/pages/DecisionDetail";
import Outcomes from "@/pages/Outcomes";
import Alerts from "@/pages/Alerts";
import Integrations from "@/pages/Integrations";
import Patterns from "@/pages/Patterns";
import Blindspots from "@/pages/Blindspots";
import Reports from "@/pages/Reports";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import Billing from "@/pages/Billing";
import Analytics from "@/pages/Analytics";
import LiveFeed from "@/pages/LiveFeed";
import DecisionInbox from "@/pages/Inbox";
import Briefing from "@/pages/Briefing";
import AdvisorIntel from "@/pages/AdvisorIntel";
import EnergyMap from "@/pages/EnergyMap";
import Legacy from "@/pages/Legacy";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(245, 80%, 65%)",
    colorForeground: "hsl(210, 40%, 98%)",
    colorMutedForeground: "hsl(215, 20.2%, 65.1%)",
    colorDanger: "hsl(38, 92%, 50%)",
    colorBackground: "hsl(222, 47%, 7%)",
    colorInput: "hsl(217, 33%, 17%)",
    colorInputForeground: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(217, 33%, 17%)",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0b0e14] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#1d2331]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white text-xl font-serif",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-white font-medium",
    footerActionLink: "text-primary hover:text-primary/90",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-emerald-500",
    alertText: "text-destructive",
    logoBox: "mx-auto w-12 h-12 flex items-center justify-center text-primary",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border-muted/50 hover:bg-white/5 text-white",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-input text-white border-muted focus:ring-primary focus:border-primary",
    footerAction: "bg-transparent",
    dividerLine: "bg-muted",
    alert: "bg-destructive/10 border-destructive text-destructive",
    otpCodeFieldInput: "bg-input text-white border-muted",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

const AUTH_QUOTES = [
  { quote: "The quality of your decisions determines the quality of your life.", author: "Ray Dalio" },
  { quote: "In any moment of decision, the best thing you can do is the right thing.", author: "Theodore Roosevelt" },
  { quote: "Decision is a sharp knife that cuts clean and straight.", author: "Gordon Graham" },
];

function AuthImagePanel({ side }: { side: "left" | "right" }) {
  const q = AUTH_QUOTES[Math.floor(Math.random() * AUTH_QUOTES.length)];
  return (
    <div className="hidden lg:flex relative w-1/2 flex-col overflow-hidden">
      <img
        src={
          side === "left"
            ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"
            : "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1200&q=80"
        }
        alt="Executive workspace"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.35) saturate(0.7)" }}
      />
      {/* Red gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            side === "left"
              ? "linear-gradient(135deg, rgba(220,38,38,0.35) 0%, rgba(5,5,5,0.6) 100%)"
              : "linear-gradient(225deg, rgba(220,38,38,0.35) 0%, rgba(5,5,5,0.6) 100%)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#DC2626" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><circle cx="19" cy="5" r="3" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-[14px] tracking-wide">Decision Brain</p>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#DC2626" }}>Intelligence OS</p>
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-4">
          <div className="text-5xl font-serif leading-none mb-2" style={{ color: "rgba(220,38,38,0.8)" }}>"</div>
          <p className="text-xl font-medium text-white leading-relaxed max-w-xs" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {q.quote}
          </p>
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>— {q.author}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { val: "94%", label: "Decision recall" },
            { val: "3.2×", label: "Faster patterns" },
            { val: "68%", label: "Fewer mistakes" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white">{s.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh]" style={{ background: "#080808" }}>
      {/* Left — image */}
      <AuthImagePanel side="left" />

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#DC2626" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><circle cx="19" cy="5" r="3" />
              </svg>
            </div>
            <span className="font-bold text-white text-base">Decision Brain</span>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#DC2626" }}>Welcome back</p>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Sign in to your OS</h1>
            <p className="text-sm mt-1" style={{ color: "#555" }}>Your decision intelligence is waiting.</p>
          </div>
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh]" style={{ background: "#080808" }}>
      {/* Left — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#DC2626" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><circle cx="19" cy="5" r="3" />
              </svg>
            </div>
            <span className="font-bold text-white text-base">Decision Brain</span>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#DC2626" }}>Get started free</p>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Build your decision OS</h1>
            <p className="text-sm mt-1" style={{ color: "#555" }}>Join executives who measure their judgment.</p>
          </div>
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </div>

      {/* Right — image */}
      <AuthImagePanel side="right" />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </Route>
  );
}

export default function App() {
  const handleSetLocation = (to: string, options?: { replace?: boolean }) => {
    const path = stripBase(to);
    if (options?.replace) {
      window.history.replaceState(null, "", basePath + path);
    } else {
      window.history.pushState(null, "", basePath + path);
    }
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <WouterRouter base={basePath}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        routerPush={(to) => handleSetLocation(to)}
        routerReplace={(to) => handleSetLocation(to, { replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ClerkQueryClientCacheInvalidator />
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <ProtectedRoute path="/home" component={Landing} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <ProtectedRoute path="/dashboard" component={Dashboard} />
              <ProtectedRoute path="/decisions" component={Decisions} />
              <ProtectedRoute path="/decisions/:id" component={DecisionDetail} />
              <ProtectedRoute path="/outcomes" component={Outcomes} />
              <ProtectedRoute path="/alerts" component={Alerts} />
              <ProtectedRoute path="/integrations" component={Integrations} />
              <ProtectedRoute path="/patterns" component={Patterns} />
              <ProtectedRoute path="/blindspots" component={Blindspots} />
              <ProtectedRoute path="/reports" component={Reports} />
              <ProtectedRoute path="/chat" component={Chat} />
              <ProtectedRoute path="/settings" component={Settings} />
              <ProtectedRoute path="/pricing" component={Pricing} />
              <ProtectedRoute path="/billing" component={Billing} />
              <ProtectedRoute path="/analytics" component={Analytics} />
              <ProtectedRoute path="/feed" component={LiveFeed} />
              <ProtectedRoute path="/inbox" component={DecisionInbox} />
              <ProtectedRoute path="/briefing/:id" component={Briefing} />
              <ProtectedRoute path="/briefing" component={Briefing} />
              <ProtectedRoute path="/advisor" component={AdvisorIntel} />
              <ProtectedRoute path="/energy" component={EnergyMap} />
              <ProtectedRoute path="/legacy" component={Legacy} />
              
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </WouterRouter>
  );
}
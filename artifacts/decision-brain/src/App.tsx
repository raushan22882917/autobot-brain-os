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

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
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
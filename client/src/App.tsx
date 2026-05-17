import { useEffect, useState, Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { getSession, type SessionInfo } from "@/lib/api";

const ChatbotSettingsPage = lazy(() => import("@/pages/ChatbotSettingsPage"));
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBasePage"));
const TestChatPage = lazy(() => import("@/pages/TestChatPage"));
const EmbedConfigPage = lazy(() => import("@/pages/EmbedConfigPage"));
const EmbeddableWidgetPage = lazy(() => import("@/pages/EmbeddableWidgetPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const EmailComposerPage = lazy(() => import("@/pages/EmailComposerPage"));
const EpcDashboardPage = lazy(() => import("@/pages/EpcDashboardPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[50vh] w-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function LazyRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<unknown>>;
}) {
  return (
    <Route path={path}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </Route>
  );
}

function AdminRoutes() {
  return (
    <Switch>
      <LazyRoute path="/" component={ChatbotSettingsPage} />
      <LazyRoute path="/knowledge-base" component={KnowledgeBasePage} />
      <LazyRoute path="/test-chat" component={TestChatPage} />
      <LazyRoute path="/analytics" component={AnalyticsPage} />
      <LazyRoute path="/embed" component={EmbedConfigPage} />
      <LazyRoute path="/email-composer" component={EmailComposerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Cookie-based admin gate. On mount we hit /api/auth/session — the backend
 * mints an anon cookie if missing. If the resulting user is is_admin, we
 * show the admin console; otherwise we show LoginPage for chat-style
 * onboarding.
 */
function AuthGate() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const s = await getSession();
      setSession(s);
    } catch (e) {
      console.error("[auth] getSession failed:", e);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (loading) return <PageLoader />;

  const isAdmin = session?.user?.is_admin === true;
  if (!isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage onLogin={refresh} session={session} />
      </Suspense>
    );
  }

  return <AdminRoutes />;
}

function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<PageLoader />}>
          {location === "/widget" ? (
            <EmbeddableWidgetPage />
          ) : location === "/epc" ? (
            <EpcDashboardPage />
          ) : (
            <AuthGate />
          )}
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

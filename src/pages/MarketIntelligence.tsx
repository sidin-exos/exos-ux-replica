import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import Header from "@/components/layout/Header";
import { QueryBuilder } from "@/components/intelligence/QueryBuilder";
import { IntelResults } from "@/components/intelligence/IntelResults";
import { RecentQueries } from "@/components/intelligence/RecentQueries";
import { IntelScenarioSelector, type IntelScenario } from "@/components/intelligence/IntelScenarioSelector";
import { ScheduledReportsPanel } from "@/components/intelligence/ScheduledReportsPanel";
import { ScheduledReportsList } from "@/components/intelligence/ScheduledReportsList";

import { MarketInsightsAdmin } from "@/components/insights/MarketInsightsAdmin";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Sparkles, Database, Search, CalendarClock, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import intelContextLight from "@/assets/intel-context-light-v2.jpg";
import intelContextDark from "@/assets/intel-context-dark.jpg";

const MarketIntelligence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { resolvedTheme } = useTheme();
  const intelContextImage = resolvedTheme === "dark" ? intelContextDark : intelContextLight;
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Derive active tab from URL path + mode param
  const activeTab = (() => {
    const segment = location.pathname.split('/').pop();
    if (segment === 'insights') return 'insights';
    if (searchParams.get('mode') === 'regular') return 'scheduled';
    return 'queries';
  })();

  const handleTabChange = (tab: string) => {
    if (tab === 'insights') {
      navigate('/market-intelligence/insights');
      return;
    }
    if (tab === 'scheduled') {
      navigate('/market-intelligence/queries?mode=regular');
      return;
    }
    navigate('/market-intelligence/queries');
  };

  // Derive selectedScenario directly from URL param
  const selectedScenario: IntelScenario =
    searchParams.get('mode') === 'regular' ? 'regular' : 'adhoc';

  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  };
  
  const { user, isLoading: isAuthLoading } = useUser();

  const {
    query,
    isLoading,
    error,
    result,
    recentQueries,
    isLoadingHistory,
    loadRecentQueries,
    clearResult,
  } = useMarketIntelligence();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <AuthPrompt
            feature="Market Intelligence"
            description="Search real-time market data, supplier news, and industry trends powered by AI"
          />
        </main>
      </div>
    );
  }

  const leftSidebar = (
    <div className="lg:col-span-1 space-y-3">
      <div className="rounded-lg border border-border bg-card border-t-4 border-t-violet-500 p-6 space-y-6">
        <RecentQueries
          queries={recentQueries}
          isLoading={isLoadingHistory}
          onLoad={loadRecentQueries}
          variant="inline"
        />
        <Separator />
        <ScheduledReportsList variant="inline" />
      </div>
    </div>
  );

  const renderScenarioContent = () => {

    if (selectedScenario === "regular") {
      return (
        <div className="grid lg:grid-cols-3 gap-6">
          {leftSidebar}
          <div className="lg:col-span-2">
            <ScheduledReportsPanel />
          </div>
        </div>
      );
    }

    // Ad-hoc flow
    return (
      <div className="grid lg:grid-cols-3 gap-6">
        {leftSidebar}
        <div className="lg:col-span-2">
          {result ? (
            <IntelResults result={result} onNewQuery={clearResult} />
          ) : (
            <QueryBuilder onSubmit={query} isLoading={isLoading} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="exos-page-title-hero text-3xl">Market Intelligence</h1>
            </div>
            <p className="text-muted-foreground text-base max-w-2xl">
              Get real-time analysis of supplier news, commodity trends, regulatory updates, and supply chain risks — powered by AI with grounded web search and source citations. Market Intelligence is a part of the EXOS engine, used as your knowledge base to improve analytical scenario results.
            </p>
          </div>
          <img
            src={intelContextImage}
            alt="Context injection into AI"
            loading="lazy"
            width={1408}
            height={768}
            className="hidden md:block shrink-0 w-72 lg:w-96 h-40 lg:h-52 object-cover"
            style={{
              // Smooth crossfade on all four sides: intersect a horizontal and a vertical
              // linear mask so top, bottom, left and right edges all blend into the page.
              maskImage:
                "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-muted/70 p-1">
            <TabsTrigger value="queries" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md">
              <Search className="h-4 w-4" />
              Ad-hoc Queries
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2 data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow-md">
              <CalendarClock className="h-4 w-4" />
              Scheduled Reports
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-iris data-[state=active]:text-iris-foreground data-[state=active]:shadow-md">
              <Database className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queries" className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Query Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderScenarioContent()}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            {renderScenarioContent()}
          </TabsContent>

          <TabsContent value="insights">
            <MarketInsightsAdmin />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="container border-t border-border/40 pt-4 pb-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} EXOS Procurement · Market Intelligence</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 px-5 text-sm gap-2" asChild>
              <a href="/pricing?subject=feedback#contact">
                <MessageSquare className="w-4 h-4" /> Leave Feedback
              </a>
            </Button>
            <Button variant="default" size="sm" className="h-9 px-5 text-sm gap-2" asChild>
              <a href="/pricing#contact">
                Get in Touch <Mail className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </footer>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
    </div>
  );
};

export default MarketIntelligence;

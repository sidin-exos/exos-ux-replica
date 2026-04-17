import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import Header from "@/components/layout/Header";
import { QueryBuilder } from "@/components/intelligence/QueryBuilder";
import { IntelResults } from "@/components/intelligence/IntelResults";
import { RecentQueries } from "@/components/intelligence/RecentQueries";
import { IntelScenarioSelector, type IntelScenario } from "@/components/intelligence/IntelScenarioSelector";
import { ScheduledReportsPanel } from "@/components/intelligence/ScheduledReportsPanel";

import { MarketInsightsAdmin } from "@/components/insights/MarketInsightsAdmin";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Sparkles, Database, Search, CalendarClock, Mail, MessageSquare, Globe, BrainCircuit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const MarketIntelligence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const renderScenarioContent = () => {

    if (selectedScenario === "regular") {
      return (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ScheduledReportsPanel />
          </div>
          <div className="lg:col-span-1">
            <RecentQueries
              queries={recentQueries}
              isLoading={isLoadingHistory}
              onLoad={loadRecentQueries}
            />
          </div>
        </div>
      );
    }

    // Ad-hoc flow
    return (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {result ? (
            <IntelResults result={result} onNewQuery={clearResult} />
          ) : (
            <QueryBuilder onSubmit={query} isLoading={isLoading} />
          )}
        </div>
        <div className="lg:col-span-1">
          <RecentQueries
            queries={recentQueries}
            isLoading={isLoadingHistory}
            onLoad={loadRecentQueries}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="exos-page-title-hero text-3xl">Market Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl leading-relaxed">
          Real-time analysis of supplier news, commodity trends, regulatory updates and supply-chain risks — grounded in <strong className="font-semibold text-foreground">live web search</strong> with <strong className="font-semibold text-foreground">source citations</strong>.
        </p>

        {/* Context injection flow */}
        <div className="mb-8 rounded-xl border border-border/50 bg-card/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary via-iris to-accent" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              How it powers EXOS
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3 sm:gap-2">
            {/* Step 1 — Sources */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 p-3">
              <div className="p-2 rounded-md bg-accent/10 text-accent shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground">Live web sources</div>
                <div className="text-[11px] text-muted-foreground leading-tight">News, filings, regulators</div>
              </div>
            </div>

            <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground/60 mx-auto" aria-hidden="true" />

            {/* Step 2 — Knowledge Base */}
            <div className="flex items-center gap-3 rounded-lg border border-iris/30 bg-iris/5 p-3">
              <div className="p-2 rounded-md bg-iris/15 text-iris shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground">EXOS Knowledge Base</div>
                <div className="text-[11px] text-muted-foreground leading-tight">Cited, structured, reusable</div>
              </div>
            </div>

            <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground/60 mx-auto" aria-hidden="true" />

            {/* Step 3 — Scenario Analysis */}
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="p-2 rounded-md bg-primary/15 text-primary shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground">Injected into scenarios</div>
                <div className="text-[11px] text-muted-foreground leading-tight">Sharper, grounded answers</div>
              </div>
            </div>
          </div>
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

        <footer className="mt-8 border-t border-border/40 pt-4 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EXOS Procurement · Market Intelligence</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 px-5 text-sm gap-2" asChild>
                <a href="/contact?subject=feedback">
                  <MessageSquare className="w-4 h-4" /> Leave Feedback
                </a>
              </Button>
              <Button variant="default" size="sm" className="h-9 px-5 text-sm gap-2" asChild>
                <a href="/contact">
                  Get in Touch <Mail className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MarketIntelligence;

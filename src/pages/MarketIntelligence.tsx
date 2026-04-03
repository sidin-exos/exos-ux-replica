import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { AlertTriangle, Sparkles, Database, Search, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";

const MarketIntelligence = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const modeParam = searchParams.get("mode") as IntelScenario | null;
  
  const defaultTab = tabParam === "insights" ? "insights" : "queries";
  const defaultScenario: IntelScenario = modeParam && ["adhoc", "regular"].includes(modeParam) ? modeParam as IntelScenario : "adhoc";
  
  const [selectedScenario, setSelectedScenario] = useState<IntelScenario>(defaultScenario);
  
  useEffect(() => {
    if (modeParam && ["adhoc", "regular"].includes(modeParam)) {
      setSelectedScenario(modeParam as IntelScenario);
    }
  }, [modeParam]);
  
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
        <p className="text-muted-foreground text-base mb-6 max-w-2/3">
          Get real-time analysis of supplier news, commodity trends, regulatory updates, and supply chain risks — powered by AI with grounded web search and source citations. Market Intelligence is a part of the EXOS engine, used as your knowledge base to improve analytical scenario results.
        </p>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/70 p-1">
            <TabsTrigger value="queries" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md">
              <Search className="h-4 w-4" />
              Ad-hoc Queries
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-iris data-[state=active]:text-iris-foreground data-[state=active]:shadow-md">
              <Database className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queries" className="space-y-6">
            <IntelScenarioSelector
              selected={selectedScenario}
              onSelect={setSelectedScenario}
            />

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Query Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderScenarioContent()}
          </TabsContent>

          <TabsContent value="insights">
            <MarketInsightsAdmin />
          </TabsContent>
        </Tabs>

        <section className="text-center py-16 flex items-center justify-center gap-4 flex-wrap">
          <SiteFeedbackButton scenarioId="market-intelligence" />
          <a href="/pricing#contact">
            <Button size="lg" className="text-lg px-8 py-6 gap-2">
              Get in Touch
              <Mail className="w-5 h-5" />
            </Button>
          </a>
        </section>
      </main>
    </div>
  );
};

export default MarketIntelligence;

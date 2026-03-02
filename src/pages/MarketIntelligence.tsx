import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { QueryBuilder } from "@/components/intelligence/QueryBuilder";
import { IntelResults } from "@/components/intelligence/IntelResults";
import { RecentQueries } from "@/components/intelligence/RecentQueries";
import { IntelScenarioSelector, type IntelScenario } from "@/components/intelligence/IntelScenarioSelector";
import { ScheduledReportsPanel } from "@/components/intelligence/ScheduledReportsPanel";
import { EnterpriseTriggerGate } from "@/components/intelligence/EnterpriseTriggerGate";
import { MarketInsightsAdmin } from "@/components/insights/MarketInsightsAdmin";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Sparkles, Database, Search } from "lucide-react";

const MarketIntelligence = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const modeParam = searchParams.get("mode") as IntelScenario | null;
  
  const defaultTab = tabParam === "insights" ? "insights" : "queries";
  const defaultScenario: IntelScenario = modeParam && ["adhoc", "regular", "triggered"].includes(modeParam) ? modeParam : "adhoc";
  
  const [selectedScenario, setSelectedScenario] = useState<IntelScenario>(defaultScenario);
  
  useEffect(() => {
    if (modeParam && ["adhoc", "regular", "triggered"].includes(modeParam)) {
      setSelectedScenario(modeParam as IntelScenario);
    }
  }, [modeParam]);
  
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

  const renderScenarioContent = () => {
    if (selectedScenario === "triggered") {
      return <EnterpriseTriggerGate />;
    }

    if (selectedScenario === "regular") {
      return <ScheduledReportsPanel />;
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Market Intelligence</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Market Intelligence is part of the EXOS engine, used to improve grounding of your AI reports and provide timely insights. 
            Get real-time analysis of supplier news, commodity trends, regulatory updates, and supply chain risks — powered by AI with grounded web search and source citations.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="queries" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Ad-hoc Queries
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
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

        <section className="text-center py-12">
          <a href="/faq#contact" className="text-primary hover:underline font-medium text-sm">
            Contact us
          </a>
        </section>
      </main>
    </div>
  );
};

export default MarketIntelligence;

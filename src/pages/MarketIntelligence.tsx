import { useState } from "react";
import Header from "@/components/layout/Header";
import { QueryBuilder } from "@/components/intelligence/QueryBuilder";
import { IntelResults } from "@/components/intelligence/IntelResults";
import { RecentQueries } from "@/components/intelligence/RecentQueries";
import { IntelScenarioSelector, type IntelScenario } from "@/components/intelligence/IntelScenarioSelector";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Sparkles } from "lucide-react";

const MarketIntelligence = () => {
  const [selectedScenario, setSelectedScenario] = useState<IntelScenario>("adhoc");
  
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
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

        {/* Scenario Selector */}
        <IntelScenarioSelector
          selected={selectedScenario}
          onSelect={setSelectedScenario}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Query Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Query Builder / Results */}
          <div className="lg:col-span-2">
            {result ? (
              <IntelResults result={result} onNewQuery={clearResult} />
            ) : (
              <QueryBuilder onSubmit={query} isLoading={isLoading} />
            )}
          </div>

          {/* Sidebar - Recent Queries */}
          <div className="lg:col-span-1">
            <RecentQueries
              queries={recentQueries}
              isLoading={isLoadingHistory}
              onLoad={loadRecentQueries}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketIntelligence;

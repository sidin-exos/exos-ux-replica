import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType } from "@/hooks/useEnterpriseTrackers";

import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import MonitorDetailView from "@/components/enterprise/MonitorDetailView";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

const USE_CASES = [
  { type: "DM-1", title: "Single-Source Supply Chain Vulnerability", text: "By analysing public shipping manifests and trade data, a procurement team identifies suppliers that are the sole source of critical components. Monitoring news and regulatory filings for these suppliers confirms or refutes the hypothesis by revealing M&A activity, production stoppages, or financial distress — enabling proactive risk mitigation." },
  { type: "DM-2", title: "Geopolitical Risk for Raw Material Sourcing", text: "A procurement organisation assesses regional sourcing risk by aggregating news on political instability, sanctions, and labour disputes alongside government travel advisories. This creates a real-time risk profile informing decisions on supplier diversification or inventory build-up before disruptions materialise." },
  { type: "DM-3", title: "Supplier Financial Health Trajectory", text: "By continuously monitoring public financial statements and news releases, the platform detects early warning signs such as declining revenue, increasing debt, or negative auditor opinions. Dynamic tracking of these public indicators allows procurement to initiate contingency planning before a crisis impacts supply." },
  { type: "DM-4", title: "Regional Compliance & Regulatory Shifts", text: "A procurement team monitors government publications and news from specific countries to track changes in environmental regulations, labour laws, or import/export tariffs. This enables proactive adjustment of sourcing strategies and contract terms to ensure compliance and avoid penalties." },
  { type: "DM-5", title: "Commodity Price Volatility & Supply Shocks", text: "By integrating data from public commodity indices, energy prices, and trade publications, procurement monitors real-time fluctuations and identifies emerging trends in critical raw material markets. This enables timely strategy adjustments — hedging, contract renegotiation, or alternative sourcing — to mitigate cost increases." },
];

const UseCaseCard = () => {
  const [index, setIndex] = useState(0);
  const current = USE_CASES[index];

  return (
    <Card className="lg:col-span-1 border-border/50 bg-card/50">
      <CardContent className="pt-5 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Use Case</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIndex((prev) => (prev + 1) % USE_CASES.length)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            More Use Cases
          </Button>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{current.type}</Badge>
            <p className="text-xs font-semibold text-foreground">{current.title}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.text}</p>
        </div>
      </CardContent>
    </Card>
  );
};



const RiskPlatform = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const [selectedTracker, setSelectedTracker] = useState<EnterpriseTracker | null>(null);
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

  const handleSelectTracker = useCallback((tracker: EnterpriseTracker) => {
    setSelectedTracker(tracker);
  }, []);

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
            feature="Dynamic Monitoring Module"
            description="Continuous Δ-first risk monitoring for procurement decision-makers"
          />
        </main>
      </div>
    );
  }

  if (selectedTracker) {
    return (
      <EnterpriseLayout>
        <Header />
        <main className="container py-8">
          <MonitorDetailView
            tracker={selectedTracker}
            onBack={() => setSelectedTracker(null)}
          />
        </main>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout>
      <Header />
      <main className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-destructive/10">
            <Activity className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Dynamic Monitoring Module
            </h1>
          </div>
        </div>

        {/* Methodology + Case Studies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 — Methodology & Tabs */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Methodology</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  The Dynamic Monitoring Module saves your time by continuously analysing publicly available information linked to risk scenarios you define, flagging focus areas for further investigation and decision-making. It follows a Δ-first approach — prioritising the direction and velocity of change over static positions — and operates as decision-support, not decision-making.
                </p>
              </div>
              <Tabs defaultValue="DM-1" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-accent/30 p-1.5 rounded-lg">
                  {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META[MonitorType]][]).map(([key, meta]) => (
                    <TabsTrigger key={key} value={key} className="text-xs flex-1 min-w-[100px] whitespace-normal leading-tight py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      {meta.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META[MonitorType]][]).map(([key, meta]) => (
                  <TabsContent key={key} value={key} className="mt-3">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Right 1/3 — Use Case */}
          <UseCaseCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 — Active Monitors */}
          <div className="lg:col-span-2">
            <Card className="rounded-sm">
              <CardContent className="pt-5">
                <h2 className="text-base font-semibold text-foreground mb-4">Active Monitors</h2>
                <TrackerList trackers={trackers} isLoading={isLoading} onSelectTracker={handleSelectTracker} />
              </CardContent>
            </Card>
          </div>

          {/* Right 1/3 — Setup Wizard */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:self-start">
            <Card className="rounded-sm border-primary/20">
              <CardContent className="pt-5">
                <h2 className="text-base font-semibold text-foreground mb-4">Set up New Monitor</h2>
                <TrackerSetupWizard
                  trackerType="risk"
                  onActivate={(data) =>
                    createTracker.mutateAsync({ ...data, tracker_type: "risk" })
                  }
                  onComplete={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </EnterpriseLayout>
  );
};

export default RiskPlatform;

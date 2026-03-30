import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType } from "@/hooks/useEnterpriseTrackers";

import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import MonitorDetailView from "@/components/enterprise/MonitorDetailView";
import { UseCaseShowcase } from "@/components/enterprise/UseCaseShowcase";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";



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
            <h1 className="text-2xl exos-page-title">
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
                  The Dynamic Monitoring Module saves you time by continuously analysing publicly available information linked to risk scenarios you define, flagging focus areas for further investigation and decision-making. It follows a Δ-first approach — prioritising the direction and velocity of change over static positions — and operates as a decision-support tool, not a decision-making one.
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
          <UseCaseShowcase platform="risk" variant="card" />
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

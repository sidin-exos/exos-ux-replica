import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Activity, Users, TrendingDown, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import MonitorDetailView from "@/components/enterprise/MonitorDetailView";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

const PRINCIPLES = [
  {
    icon: Users,
    title: "Human-in-the-Loop by Design",
    description: "Decision-support, not decision-making. Every output is framed as information for consideration — the final judgement always belongs to the human.",
  },
  {
    icon: TrendingDown,
    title: "Dynamics over Absolutes",
    description: "The system is designed to save user's time by flagging rising risks for further analysis and decision-making.",
  },
  {
    icon: Layers,
    title: "Continuous Modelling, Not Advice",
    description: "The module monitors and models possible risk events. It does not prescribe action plans. When deep analysis is needed, it bridges to point-in-time scenarios.",
  },
];

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

        {/* Methodology overview */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="pt-5 pb-4 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Methodology</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                The Dynamic Risk Monitoring is intended to save your time by constantly analysing publicly available information linked to risk scenarios set by user, flagging focus areas for futher investigation and decision-making. 
              </p>
            </div>

            {/* 3 Principles */}
            <div className="grid gap-3 sm:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="flex gap-3 items-start">
                  <div className="p-1.5 rounded-md bg-destructive/10 shrink-0 mt-0.5">
                    <p.icon className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>

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

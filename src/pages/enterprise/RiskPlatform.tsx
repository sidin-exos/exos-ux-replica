import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Activity, Users, TrendingDown, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import MonitorDetailView from "@/components/enterprise/MonitorDetailView";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { useEnterpriseTrackers, MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType } from "@/hooks/useEnterpriseTrackers";

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
  const [activeTab, setActiveTab] = useState("monitor");
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

            {/* Monitoring types grid */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Monitoring Types</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META["DM-1"]][]).map(([id, m]) => (
                  <div key={id} className="flex items-start gap-2 rounded-md border border-border bg-background p-2.5">
                    <Badge variant="default" className="shrink-0 text-[10px] mt-0.5">
                      {id}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">
                        {m.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{m.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="setup">New Monitor</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="mt-6">
            <TrackerList trackers={trackers} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="setup" className="mt-6">
            <TrackerSetupWizard
              trackerType="risk"
              onActivate={(data) =>
                createTracker.mutateAsync({ ...data, tracker_type: "risk" })
              }
              onComplete={() => setActiveTab("monitor")}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="text-center py-16 text-muted-foreground">
              Reports will be available once monitors generate their first analysis cycle.
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </EnterpriseLayout>
  );
};

export default RiskPlatform;

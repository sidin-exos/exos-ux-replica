import { useState } from "react";
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
import { useEnterpriseTrackers, MONITOR_TYPE_META, DRS_BAND_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType, DrsBand } from "@/hooks/useEnterpriseTrackers";

const PRINCIPLES = [
  {
    icon: Users,
    title: "Human-in-the-Loop by Design",
    description: "Decision-support, not decision-making. Every output is framed as information for consideration — the final judgement always belongs to the human.",
  },
  {
    icon: TrendingDown,
    title: "Dynamics over Absolutes",
    description: "The Δ arrow is always the dominant signal. A DRS of 62 that was 78 last quarter tells a different story than one that was 55. Trajectories over positions.",
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
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

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
            <p className="text-sm text-muted-foreground">
              Δ-first continuous risk monitoring — trajectories, not static scores.
            </p>
          </div>
        </div>

        {/* Methodology overview */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="pt-5 pb-4 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Methodology</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                The Dynamic Monitoring Module operates as a parallel system alongside analytical scenarios. 
                It uses the <strong className="text-foreground">Dynamic Risk Score (DRS, 0–100, 100 = most stable)</strong> with 
                the <strong className="text-foreground">Δ-First Principle</strong> — every output prioritises direction and velocity 
                of change over absolute position. Like a seismograph, not a thermometer.
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
                    <Badge variant={m.phase === 1 ? "default" : "outline"} className="shrink-0 text-[10px] mt-0.5">
                      {id}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">
                        {m.label}
                        {m.phase === 2 && <span className="text-muted-foreground ml-1.5 font-normal">· Coming Soon</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{m.purpose}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        DRS: {m.drs ? "Applied" : "Not applicable"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DRS Band legend */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">DRS Bands</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(Object.entries(DRS_BAND_META) as [DrsBand, typeof DRS_BAND_META["A"]][]).map(([band, meta]) => (
                  <span key={band} className="text-[11px]">
                    <span className={`font-semibold ${meta.color}`}>{band}</span>
                    <span className="text-muted-foreground"> {meta.range} — {meta.label}</span>
                  </span>
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

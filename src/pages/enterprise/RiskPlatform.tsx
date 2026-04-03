import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Activity, BarChart3, FileText, Gauge, Mail, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType } from "@/hooks/useEnterpriseTrackers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import MonitorDetailView from "@/components/enterprise/MonitorDetailView";
import { UseCaseShowcase } from "@/components/enterprise/UseCaseShowcase";
import RiskSummaryDashboard from "@/components/enterprise/RiskSummaryDashboard";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";



const RiskPlatform = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const [selectedTracker, setSelectedTracker] = useState<EnterpriseTracker | null>(null);
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

  const MAX_REPORTS_PER_MONTH = 50;

  // Count reports generated this month
  const { data: reportsThisMonth = 0 } = useQuery({
    queryKey: ["monitor_reports_count_month", "risk"],
    enabled: !!user,
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const trackerIds = trackers.map((t) => t.id);
      if (trackerIds.length === 0) return 0;

      const { count, error } = await supabase
        .from("monitor_reports" as any)
        .select("id", { count: "exact", head: true })
        .in("tracker_id", trackerIds)
        .gte("created_at", startOfMonth.toISOString());

      if (error) return 0;
      return count ?? 0;
    },
  });

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
               Dynamic Risk Monitoring
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
                <TabsList className="w-full grid grid-cols-5 h-auto gap-1.5 bg-accent/20 p-2 rounded-lg border border-border/40">
                  {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META[MonitorType]][]).map(([key, meta]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="text-xs whitespace-normal leading-tight py-2.5 px-2 rounded-md transition-all
                        border border-border/50 bg-card shadow-sm
                        hover:bg-accent/60 hover:shadow-md hover:border-border
                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary/30 data-[state=active]:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)] data-[state=active]:ring-1 data-[state=active]:ring-primary/20"
                    >
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


        {/* Workspace separator */}
        <div className="flex items-center gap-4 my-2">
          <h2 className="text-sm font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wide">Your Workspace</h2>
          <Separator className="flex-1" />
        </div>

        {/* Setup Wizard (2/3) + Usage Stats (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-sm border-primary/20">
              <CardContent className="pt-5">
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

          {/* Right 1/3 — Usage Statistics */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:self-start">
            <Card className="rounded-sm border-border/50 bg-card/50">
              <CardContent className="pt-5 space-y-5">
                {/* Signal Summary */}
                <RiskSummaryDashboard trackers={trackers} />

                {/* Separator */}
                <div className="border-t border-border" />

                <h2 className="text-base font-semibold text-foreground">Usage Statistics</h2>

                {/* Active Monitors */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Active Monitors</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground">
                    {trackers.filter((t) => t.status === "active").length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {trackers.length} total ({trackers.filter((t) => t.status === "setup").length} in setup)
                  </p>
                </div>

                {/* Reports This Month */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-iris" />
                    <span className="text-xs text-muted-foreground">Reports This Month</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-display font-bold text-foreground">
                      {reportsThisMonth}
                    </p>
                    <span className="text-sm text-muted-foreground">/ {MAX_REPORTS_PER_MONTH}</span>
                  </div>
                  <Progress
                    value={Math.min((reportsThisMonth / MAX_REPORTS_PER_MONTH) * 100, 100)}
                    className="h-1.5 mt-2"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Professional tier · {MAX_REPORTS_PER_MONTH - reportsThisMonth > 0 ? `${MAX_REPORTS_PER_MONTH - reportsThisMonth} remaining` : "Limit reached"}
                  </p>
                </div>

                {/* Max Reports */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-copper" />
                    <span className="text-xs text-muted-foreground">Monthly Report Limit</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground">
                    {MAX_REPORTS_PER_MONTH}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Professional tier allowance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Monitors — full width below */}
        <Card className="rounded-sm">
          <CardContent className="pt-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Active Monitors</h2>
            <TrackerList trackers={trackers} isLoading={isLoading} onSelectTracker={handleSelectTracker} />
          </CardContent>
        </Card>

        {/* Lightweight footer */}
        <footer className="mt-8 border-t border-border/40 pt-4 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EXOS Procurement · Dynamic Risk Monitoring</span>
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
    </EnterpriseLayout>
  );
};

export default RiskPlatform;

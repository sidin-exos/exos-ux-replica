import { useCallback, useMemo } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

  // Derive selected tracker from URL param
  const selectedTracker = id
    ? (trackers?.find(t => t.id === id) ?? null)
    : null;

  // After trackers have loaded, if an ID was requested but not found → redirect
  const trackerNotFound = id && !isLoading && !selectedTracker;

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
    navigate(`/enterprise/risk/monitor/${tracker.id}`);
  }, [navigate]);

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

  if (isLoading && id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (trackerNotFound) {
    return <Navigate to="/enterprise/risk" replace />;
  }

  if (selectedTracker) {
    return (
      <EnterpriseLayout>
        <Header />
        <main className="container py-8">
          <MonitorDetailView
            tracker={selectedTracker}
            onBack={() => navigate('/enterprise/risk')}
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
              Risk Assessment Platform
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl mt-1 leading-relaxed">
              The Dynamic Monitoring Module saves you time by continuously analysing publicly available information linked to risk scenarios you define, flagging focus areas for further investigation and decision-making. It follows a <strong className="font-semibold text-primary">Signal-First</strong> approach, prioritising the <strong className="font-semibold text-foreground">direction</strong> and <strong className="font-semibold text-foreground">velocity</strong> of change over static positions, and is designed to inform your judgement, not replace it.
            </p>
          </div>
        </div>

        {/* Monitoring Modules + Case Studies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 — Vertical-tab module switcher */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-5">
              <Tabs defaultValue="DM-1" orientation="vertical" className="w-full flex flex-col sm:flex-row gap-5">
                <TabsList className="flex sm:flex-col h-auto w-full sm:w-48 shrink-0 gap-1 bg-transparent p-0 justify-start">
                  {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META[MonitorType]][]).map(([key, meta]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="w-full justify-start text-left text-xs font-medium whitespace-normal leading-tight py-2.5 px-3 rounded-md transition-all
                        border-l-2 border-transparent text-muted-foreground
                        hover:bg-accent/40 hover:text-foreground
                        data-[state=active]:bg-accent/60 data-[state=active]:text-foreground data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                      {meta.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex-1 sm:border-l sm:border-border/50 sm:pl-5 min-w-0">
                  {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META[MonitorType]][]).map(([key, meta]) => (
                    <TabsContent key={key} value={key} className="mt-0 space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {meta.description}
                      </p>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right 1/3 — Use Case */}
          <UseCaseShowcase platform="risk" variant="card" />
        </div>


        {/* Workspace section — sticky */}
        <div className="sticky top-16 z-30 bg-background pt-4 pb-2 -mx-4 px-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-primary via-iris to-copper" />
            <h2 className="text-sm font-bold text-foreground whitespace-nowrap uppercase tracking-wider">
              Your Risk Monitoring Workspace
            </h2>
            <Separator className="flex-1" />
          </div>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Gauge className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] text-muted-foreground">Monitors</span>
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">
                      {trackers.filter((t) => t.status === "active").length}
                      <span className="text-sm font-normal text-muted-foreground"> / {trackers.length}</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-iris" />
                      <span className="text-[11px] text-muted-foreground">Reports</span>
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">
                      {reportsThisMonth}
                      <span className="text-sm font-normal text-muted-foreground"> / {MAX_REPORTS_PER_MONTH}</span>
                    </p>
                  </div>
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

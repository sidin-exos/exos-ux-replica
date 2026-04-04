import { useState, useMemo, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { TrendingUp, BarChart3, Rss, Newspaper, Mail, MessageSquare } from "lucide-react";
import signalRadarImg from "@/assets/design_variant_b.png";
import signalRadarDarkImg from "@/assets/design_variant_b_transparent.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import InflationSetupWizard from "@/components/enterprise/InflationSetupWizard";
import InflationTrackerCard from "@/components/enterprise/InflationTrackerCard";
import InflationDetailView from "@/components/enterprise/InflationDetailView";
import { useInflationTrackers } from "@/hooks/useInflationTrackers";
import type { InflationTracker } from "@/hooks/useInflationTrackers";

const MOCK_NEWS_FEED = [
  { title: "Commodity prices stabilise amid mixed economic signals across EU markets", tracker: "DDR5 prices FOB Ningbo", date: "Mar 28, 2026", source: "Reuters" },
  { title: "Agricultural labour shortages forecast for Southern Europe Q3-Q4", tracker: "Seasonal workers (agriculture)", date: "Mar 27, 2026", source: "Eurostat" },
  { title: "EU tariff review expected to impact raw material import costs", tracker: "DDR5 prices FOB Ningbo", date: "Mar 26, 2026", source: "FT" },
  { title: "Greece labour ministry announces seasonal worker visa programme changes", tracker: "Seasonal workers (agriculture)", date: "Mar 25, 2026", source: "Kathimerini" },
  { title: "DRAM spot prices hold steady as demand normalises post-Q1 surge", tracker: "DDR5 prices FOB Ningbo", date: "Mar 24, 2026", source: "TrendForce" },
];

const InflationPlatform = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTracker, setSelectedTracker] = useState<InflationTracker | null>(null);
  const { trackers, isLoading, createTracker, deleteTracker } = useInflationTrackers();

  const handleSelectTracker = useCallback((tracker: InflationTracker) => {
    setSelectedTracker(tracker);
  }, []);

  // Build news feed matched to actual tracker names
  const newsFeed = useMemo(() => {
    if (trackers.length === 0) return MOCK_NEWS_FEED;
    return MOCK_NEWS_FEED.map((n, i) => ({
      ...n,
      tracker: trackers[i % trackers.length]?.goods_definition ?? n.tracker,
    }));
  }, [trackers]);

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
            feature="Inflation Monitoring"
            description="Track and analyze inflation drivers affecting your procurement portfolio"
          />
        </main>
      </div>
    );
  }

  // Detail view — replaces the whole page like RiskPlatform
  if (selectedTracker) {
    return (
      <EnterpriseLayout>
        <Header />
        <main className="container py-8">
          <InflationDetailView
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
        {/* Header row: 2/3 title + 1/3 status badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                Inflation Monitoring
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl mt-1">
                A human-in-the-loop AI platform that helps you structure inflation monitoring with an easy-to-use framework for decision-making. It is not intended to replace enterprise-grade financial analytical platforms or serve as a tool for commodity traders.
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground max-w-2xl list-disc list-inside">
                <li>Choose the goods or service you want to monitor</li>
                <li>EXOS recommends 5 inflation triggers — adjust the list and set relative importance</li>
                <li>Pick a monitoring schedule to manage your AI usage</li>
              </ul>
              <p className="mt-1.5 text-xs font-medium text-foreground/70">Our monitoring pipeline is set. Simple as that!</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <img src={signalRadarImg} alt="Signal radar illustration" loading="lazy" width={256} height={128} className="w-64 h-auto object-contain opacity-80 mix-blend-multiply dark:hidden" />
            <img src={signalRadarDarkImg} alt="Signal radar illustration" loading="lazy" width={256} height={384} className="w-64 h-auto object-contain opacity-80 hidden dark:block" />
          </div>
        </div>

        {/* Workspace separator */}
        <div className="flex items-center gap-4 my-2">
          <h2 className="text-sm font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wide">Your Workspace</h2>
          <Separator className="flex-1" />
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4 mr-1.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="setup">New Tracker</TabsTrigger>
              <TabsTrigger value="events">
                <Rss className="w-4 h-4 mr-1.5" /> Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2/3 — Tracker list */}
                <div className="lg:col-span-2 space-y-2">
                  {isLoading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading trackers…</div>
                  ) : trackers.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      No trackers yet. Create your first tracker to start monitoring.
                    </div>
                  ) : (
                    trackers.map(t => (
                      <InflationTrackerCard
                        key={t.id}
                        tracker={t}
                        onSelect={handleSelectTracker}
                        onDelete={(id) => deleteTracker.mutate(id)}
                      />
                    ))
                  )}
                </div>

                {/* 1/3 — News feed sidebar */}
                <div>
                  <Card className="border-iris/25 bg-iris/5 dark:bg-surface sticky top-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5" /> Market Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {newsFeed.map((n, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">{n.tracker}</Badge>
                            <span className="text-xs text-muted-foreground">{n.source} · {n.date}</span>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground/60 pt-1">
                        Signals will auto-update once scanning is live.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="mt-4">
              <InflationSetupWizard
                onActivate={(data) => createTracker.mutateAsync(data)}
                onComplete={() => setActiveTab("dashboard")}
              />
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <div className="text-center py-16 text-muted-foreground">
                Event feed will populate once drivers begin their scan cycles.
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {/* Lightweight footer */}
        <footer className="mt-8 border-t border-border/40 pt-4 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EXOS Procurement · Inflation Monitoring</span>
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

export default InflationPlatform;

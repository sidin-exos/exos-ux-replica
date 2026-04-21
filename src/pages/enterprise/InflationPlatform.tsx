import { useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackers, isLoading, createTracker, deleteTracker } = useInflationTrackers();

  // Derive activeTab from URL path segment
  const activeTab = (() => {
    const segment = location.pathname.split('/').pop();
    if (segment === 'setup') return 'setup';
    if (segment === 'events') return 'events';
    return 'dashboard';
  })();

  // Derive selectedTracker from URL param
  const selectedTracker = id
    ? (trackers?.find(t => t.id === id) ?? null)
    : null;

  const trackerNotFound = id && !isLoading && !selectedTracker;

  const handleSelectTracker = useCallback((tracker: InflationTracker) => {
    navigate(`/enterprise/inflation/tracker/${tracker.id}`);
  }, [navigate]);

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

  // Loading state for deep-linked tracker detail
  if (id && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Tracker ID in URL but not found after load → redirect
  if (trackerNotFound) {
    return <Navigate to="/enterprise/inflation" replace />;
  }

  // Detail view — replaces the whole page like RiskPlatform
  if (selectedTracker) {
    return (
      <EnterpriseLayout>
        <Header />
        <main className="container py-8">
          <InflationDetailView
            tracker={selectedTracker}
            onBack={() => navigate('/enterprise/inflation/dashboard')}
          />
        </main>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout>
      <Header />
      <main className="container py-8 space-y-6">
        {/* Polished intro banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-muted/40 via-background to-warning/5 p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 relative max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-warning" />
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-warning">
                  Inflation Monitoring
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-semibold tracking-tight text-foreground mb-3">
                Inflation Monitoring
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                A human-in-the-loop AI platform that helps you structure inflation monitoring with an easy-to-use framework for decision-making. It is not intended to replace enterprise-grade financial analytical platforms or serve as a tool for commodity traders.
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside mb-2">
                <li>Choose the goods or service you want to monitor</li>
                <li>EXOS recommends 5 inflation triggers — adjust the list and set relative importance</li>
                <li>Pick a monitoring schedule to manage your AI usage</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">Our monitoring pipeline is set. Simple as that!</p>
              <div className="flex flex-wrap gap-8 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Step 1</div>
                  <div className="text-sm font-medium text-foreground">Define goods or services</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Step 2</div>
                  <div className="text-sm font-medium text-foreground">Tune and approve triggers</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Step 3</div>
                  <div className="text-sm font-medium text-foreground">Set AI usage</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <img src={signalRadarImg} alt="Signal radar illustration" loading="lazy" width={256} height={128} className="w-64 h-auto object-contain opacity-80 mix-blend-multiply dark:hidden" />
              <img src={signalRadarDarkImg} alt="Signal radar illustration" loading="lazy" width={256} height={384} className="w-64 h-auto object-contain opacity-80 hidden dark:block" />
            </div>
          </div>
        </div>

        {/* Workspace section — sticky */}
        <div className="sticky top-16 z-30 bg-background pt-4 pb-2 -mx-4 px-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-primary via-iris to-copper" />
            <h2 className="text-sm font-bold text-foreground whitespace-nowrap uppercase tracking-wider">
              Your Inflation Monitoring Workspace
            </h2>
            <Separator className="flex-1" />
          </div>
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={(tab) => navigate(`/enterprise/inflation/${tab}`)}>
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
                <div className="lg:col-span-2 space-y-6">
                  {isLoading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading trackers…</div>
                  ) : trackers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <p className="text-muted-foreground">No trackers yet. Create your first tracker to start monitoring.</p>
                      <Button
                        onClick={() => navigate('/enterprise/inflation/setup')}
                        variant="outline"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Create Your First Tracker
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 pb-1 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/70">Driver status:</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />Deteriorating</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" />Stable</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" />Improving</span>
                      </div>
                      {trackers.map(t => (
                        <InflationTrackerCard
                          key={t.id}
                          tracker={t}
                          onSelect={handleSelectTracker}
                          onDelete={(id) => deleteTracker.mutate(id)}
                        />
                      ))}
                    </>
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
                        <div
                          key={i}
                          className="group space-y-1 rounded-md -mx-1.5 px-1.5 py-1 transition-colors hover:bg-iris/10"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iris/60 group-hover:bg-iris transition-colors"
                            />
                            <p className="text-xs font-medium text-foreground leading-snug line-clamp-1 group-hover:line-clamp-none transition-all flex-1">
                              {n.title}
                            </p>
                          </div>
                          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pl-3.5">
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">{n.tracker}</Badge>
                                <span className="text-xs text-muted-foreground">{n.source} · {n.date}</span>
                              </div>
                            </div>
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
                onComplete={() => navigate('/enterprise/inflation/dashboard')}
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
                <a href="/pricing?subject=feedback#contact">
                  <MessageSquare className="w-4 h-4" /> Leave Feedback
                </a>
              </Button>
              <Button variant="default" size="sm" className="h-9 px-5 text-sm gap-2" asChild>
                <a href="/pricing#contact">
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

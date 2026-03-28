import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { TrendingUp, BarChart3, Rss } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import InflationSetupWizard from "@/components/enterprise/InflationSetupWizard";
import InflationTrackerCard from "@/components/enterprise/InflationTrackerCard";
import { useInflationTrackers } from "@/hooks/useInflationTrackers";

const InflationPlatform = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { trackers, isLoading, createTracker } = useInflationTrackers();

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
            feature="Inflation Monitor"
            description="Track and analyze inflation drivers affecting your procurement portfolio"
          />
        </main>
      </div>
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
                Inflation Monitor
              </h1>
              <p className="text-sm text-muted-foreground">
                Price Driver Framework — driver-centric inflation intelligence.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:justify-end">
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Improving</Badge>
            <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">Stable</Badge>
            <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Deteriorating</Badge>
          </div>
        </div>

        {/* Main content: 2/3 workspace + 1/3 methodology */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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

              <TabsContent value="dashboard" className="mt-4 space-y-4">
                {isLoading ? (
                  <div className="text-center py-16 text-muted-foreground">Loading trackers…</div>
                ) : trackers.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    No trackers yet. Create your first tracker to start monitoring.
                  </div>
                ) : (
                  trackers.map(t => <InflationTrackerCard key={t.id} tracker={t} />)
                )}
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

          {/* 1/3 sidebar: methodology */}
          <div>
            <Card className="border-warning/20 bg-warning/[0.03] sticky top-24">
              <CardContent className="pt-5 pb-4 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">How it works</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Define the goods you procure → EXOS proposes <strong className="text-foreground">inflation drivers</strong> → configure weights & triggers → monitor status changes.
                </p>
                <p className="text-xs text-muted-foreground">
                  Drivers are enriched periodically and scanned for trigger events at the cadence you define.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </EnterpriseLayout>
  );
};

export default InflationPlatform;

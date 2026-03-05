import { useState } from "react";
import { TrendingUp, LineChart, Layers, Globe, CalendarClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

const CAPABILITIES = [
  {
    icon: LineChart,
    title: "Commodity Price Tracking",
    description: "Monitor raw material and commodity indices relevant to your procurement categories — metals, energy, chemicals, packaging, and more.",
  },
  {
    icon: Layers,
    title: "Cost-Structure Decomposition",
    description: "Upload your cost breakdowns and supplier quotes. EXOS maps each cost component to market indices for granular inflation visibility.",
  },
  {
    icon: Globe,
    title: "Regional & Sector Intelligence",
    description: "Track inflation drivers across geographies and industry sectors, including labour costs, logistics rates, and regulatory-driven price shifts.",
  },
  {
    icon: CalendarClock,
    title: "Trend Forecasting & Alerts",
    description: "Receive periodic forecasts and threshold-based alerts so you can renegotiate or hedge before price spikes hit your P&L.",
  },
];

const InflationPlatform = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("inflation");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-warning/10">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Inflation Analysis Platform
            </h1>
            <p className="text-sm text-muted-foreground">
              Persistent commodity & cost-index tracking for proactive procurement decisions.
            </p>
          </div>
        </div>

        {/* Instructional overview */}
        <Card className="border-warning/20 bg-warning/[0.03]">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">How it works</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Move beyond static price comparisons. This platform provides <strong className="text-foreground">continuous inflation intelligence</strong> — 
                define the commodities and cost categories you procure, upload historical spend data or supplier quotes, 
                and EXOS will track relevant market indices, flag emerging price trends, and deliver actionable forecasts 
                so you can negotiate from a position of data-backed strength.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} className="flex gap-3 items-start">
                  <div className="p-1.5 rounded-md bg-warning/10 shrink-0 mt-0.5">
                    <cap.icon className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cap.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="setup">Setup New Tracker</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="mt-6">
            <TrackerList trackers={trackers} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="setup" className="mt-6">
            <TrackerSetupWizard
              trackerType="inflation"
              onActivate={(data) =>
                createTracker.mutateAsync({ ...data, tracker_type: "inflation" })
              }
              onComplete={() => setActiveTab("monitor")}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="text-center py-16 text-muted-foreground">
              Reports will be available once trackers generate their first analysis cycle.
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InflationPlatform;

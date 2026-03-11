import { useState } from "react";
import { ShieldAlert, AlertTriangle, BarChart3, Bell, FileSearch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import EnterpriseLayout from "@/components/layout/EnterpriseLayout";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

const CAPABILITIES = [
  {
    icon: AlertTriangle,
    title: "Supply Chain Disruption Alerts",
    description: "Get early warnings on geopolitical events, supplier financial health, and logistics disruptions that may impact your categories.",
  },
  {
    icon: FileSearch,
    title: "Document-Driven Analysis",
    description: "Upload contracts, supplier reports, and spend data. Our AI extracts risk signals and maps them against market conditions.",
  },
  {
    icon: BarChart3,
    title: "Continuous Risk Scoring",
    description: "Each tracker maintains a live risk score across dimensions: supply concentration, price volatility, regulatory exposure, and more.",
  },
  {
    icon: Bell,
    title: "Scheduled Reports & Triggers",
    description: "Configure thresholds and receive automated reports when risk levels change — no manual monitoring required.",
  },
];

const RiskPlatform = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

  return (
    <EnterpriseLayout>
      <Header />
      <main className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-destructive/10">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Risk Assessment Platform
            </h1>
            <p className="text-sm text-muted-foreground">
              Continuous supply-chain & category risk monitoring for enterprise teams.
            </p>
          </div>
        </div>

        {/* Instructional overview */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">How it works</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Unlike one-off risk scenarios, this platform provides <strong className="text-foreground">persistent monitoring</strong>. 
                Define the goods, services, or categories you want to track, upload relevant documents 
                (contracts, spend reports, supplier data), and EXOS will continuously analyse market signals, 
                supplier health, and regulatory changes — delivering updated risk assessments on a schedule you control.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} className="flex gap-3 items-start">
                  <div className="p-1.5 rounded-md bg-destructive/10 shrink-0 mt-0.5">
                    <cap.icon className="w-4 h-4 text-destructive" />
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
              trackerType="risk"
              onActivate={(data) =>
                createTracker.mutateAsync({ ...data, tracker_type: "risk" })
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
    </EnterpriseLayout>
  );
};

export default RiskPlatform;

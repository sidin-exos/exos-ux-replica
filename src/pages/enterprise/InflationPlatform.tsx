import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

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

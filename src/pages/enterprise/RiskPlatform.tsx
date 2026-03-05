import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import TrackerSetupWizard from "@/components/enterprise/TrackerSetupWizard";
import TrackerList from "@/components/enterprise/TrackerList";
import { useEnterpriseTrackers } from "@/hooks/useEnterpriseTrackers";

const RiskPlatform = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const { trackers, isLoading, createTracker } = useEnterpriseTrackers("risk");

  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
};

export default RiskPlatform;

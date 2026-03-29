import { useNavigate } from "react-router-dom";
import { Loader2, Settings, History, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCoachingCards } from "@/hooks/useMethodologyAdmin";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_META: Record<string, { label: string; color: string }> = {
  A: { label: "Analytical Value", color: "bg-info/15 text-info dark:bg-info/30 dark:text-info" },
  B: { label: "Workflow & Documentation", color: "bg-success/15 text-success dark:bg-success/30 dark:text-success" },
  C: { label: "Reliability & Compliance", color: "bg-copper/15 text-copper dark:bg-copper/30 dark:text-copper" },
  D: { label: "Strategy", color: "bg-iris/15 text-iris dark:bg-iris/30 dark:text-iris" },
  E: { label: "Real-Time Knowledge", color: "bg-primary/15 text-primary dark:bg-primary/30 dark:text-primary" },
};

const CONNECTION_MAP = [
  { source: "Coaching Cards", consumers: "chat-copilot, scenario-chat-assistant" },
  { source: "Field Configuration", consumers: "Input Evaluator (client-side), generate-test-data, sentinel-analysis" },
  { source: "Global Config (Bot Identity, GDPR, Escalation)", consumers: "chat-copilot (identity, tone), scenario-chat-assistant (GDPR)" },
  { source: "Industry Contexts (DB)", consumers: "sentinel-analysis (XML grounding)" },
  { source: "Procurement Categories", consumers: "sentinel-analysis (XML grounding)" },
  { source: "Validation Rules (DB)", consumers: "sentinel-analysis (output checks)" },
  { source: "Market Insights (DB)", consumers: "sentinel-analysis (market grounding)" },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MethodologyDashboard = () => {
  const navigate = useNavigate();
  const { data: cards, isLoading } = useCoachingCards();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group cards by scenario_group
  const groups = new Map<string, typeof cards>();
  for (const card of cards ?? []) {
    const group = groups.get(card.scenario_group) ?? [];
    group.push(card);
    groups.set(card.scenario_group, group);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl py-12 space-y-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Methodology Management</h1>
            <p className="text-muted-foreground mt-1">
              View and edit coaching cards, field configs, and global settings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/methodology/config")}>
              <Settings className="w-4 h-4 mr-2" /> Global Config
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/methodology/history")}>
              <History className="w-4 h-4 mr-2" /> Change History
            </Button>
          </div>
        </div>

        {/* Connection Map */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Connection Map</h2>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Source</TableHead>
                  <TableHead>Consumed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONNECTION_MAP.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium text-sm">{row.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.consumers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground italic">
            Editing a coaching card affects the chatbot's coaching behavior for that scenario. Changes take effect immediately — no deployment needed.
          </p>
        </section>

        {/* Scenario Cards by Group */}
        <section className="space-y-8">
          <h2 className="text-lg font-semibold">Scenarios ({cards?.length ?? 0})</h2>

          {["A", "B", "C", "D", "E"].map((groupKey) => {
            const groupCards = groups.get(groupKey);
            if (!groupCards?.length) return null;
            const meta = GROUP_META[groupKey];

            return (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`${meta.color} border-0`}>{groupKey}</Badge>
                  <h3 className="font-semibold">
                    {meta.label}{" "}
                    <span className="text-muted-foreground font-normal">({groupCards.length} scenarios)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupCards.map((card) => (
                    <div
                      key={card.scenario_slug}
                      className="bg-card border border-border rounded-lg p-5 group hover:border-primary/30 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/admin/methodology/${card.scenario_slug}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {card.scenario_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            #{card.scenario_id}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <Badge className={`${meta.color} border-0 text-xs`}>{groupKey}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {card.confidence_dependency}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        Updated {relativeTime(card.updated_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default MethodologyDashboard;

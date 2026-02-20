import { BarChart3, FileText, CheckCircle, Clock, Zap, Target } from "lucide-react";
import { useTestStats } from "@/hooks/useTestDatabase";
import StatCard from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const AUDIT_THRESHOLD = 10;

interface TestStatsCardsProps {
  scenarioType?: string;
}

const TestStatsCards = ({ scenarioType }: TestStatsCardsProps) => {
  const { data: stats, isLoading } = useTestStats(scenarioType);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const totalReports = stats?.totalReports ?? 0;
  const progressPct = Math.min((totalReports / AUDIT_THRESHOLD) * 100, 100);
  const isReady = totalReports >= AUDIT_THRESHOLD;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={scenarioType ? "Scenario Prompts" : "Total Prompts"}
          value={String(stats?.totalPrompts ?? 0)}
          icon={FileText}
        />
        <StatCard
          title={scenarioType ? "Scenario Reports" : "Total Reports"}
          value={String(stats?.totalReports ?? 0)}
          icon={BarChart3}
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate ?? 0}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Processing"
          value={`${stats?.avgProcessingTimeMs ?? 0}ms`}
          icon={Clock}
        />
        <StatCard
          title="Avg Tokens"
          value={String(stats?.avgTotalTokens ?? 0)}
          icon={Zap}
        />
      </div>

      {scenarioType && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Target className="w-4 h-4 text-primary" />
              Scenario Audit Readiness
            </span>
            <span className={`font-mono text-xs ${isReady ? "text-green-600 font-bold" : "text-muted-foreground"}`}>
              {totalReports} / {AUDIT_THRESHOLD} runs
            </span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          {isReady && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Threshold reached — ready to export for AI audit.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TestStatsCards;

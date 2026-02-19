import { BarChart3, FileText, CheckCircle, Clock } from "lucide-react";
import { useTestStats } from "@/hooks/useTestDatabase";
import StatCard from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

const TestStatsCards = () => {
  const { data: stats, isLoading } = useTestStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Prompts"
        value={String(stats?.totalPrompts ?? 0)}
        icon={FileText}
      />
      <StatCard
        title="Total Reports"
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
    </div>
  );
};

export default TestStatsCards;

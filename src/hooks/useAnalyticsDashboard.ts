import { useQueries, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ScenarioBreakdown {
  type: string;
  count: number;
  successRate: number;
  avgTimeMs: number;
  avgTokens: number;
}

interface IntelBreakdown {
  type: string;
  count: number;
  successRate: number;
}

interface GrowthPoint {
  month: string;
  count: number;
}

interface FeedbackItem {
  id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
  scenario_id: string;
}

function groupByMonth(rows: { created_at: string }[]): GrowthPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const month = format(new Date(row.created_at), "yyyy-MM");
    map.set(month, (map.get(month) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export function useAnalyticsDashboard() {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      // 0: profiles
      {
        queryKey: ["analytics-profiles"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 1: organizations
      {
        queryKey: ["analytics-orgs"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("organizations")
            .select("id, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 2: test_prompts
      {
        queryKey: ["analytics-prompts"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("test_prompts")
            .select("id, scenario_type, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 3: test_reports
      {
        queryKey: ["analytics-reports"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("test_reports")
            .select("id, prompt_id, success, processing_time_ms, total_tokens, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 4: intel_queries
      {
        queryKey: ["analytics-intel"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("intel_queries")
            .select("id, query_type, success, processing_time_ms, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 5: market_insights (count only)
      {
        queryKey: ["analytics-insights"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("market_insights")
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
      // 6: scenario_feedback
      {
        queryKey: ["analytics-scenario-feedback"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("scenario_feedback")
            .select("id, scenario_id, rating, feedback_text, created_at")
            .order("created_at", { ascending: false });
          if (error) throw error;
          return data || [];
        },
      },
      // 7: chat_feedback
      {
        queryKey: ["analytics-chat-feedback"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("chat_feedback")
            .select("id, rating, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      // 8: user_files (count only)
      {
        queryKey: ["analytics-files"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("user_files")
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
      // 9: enterprise_trackers (count only)
      {
        queryKey: ["analytics-trackers"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("enterprise_trackers")
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error || null;

  const profiles = (results[0].data || []) as { id: string; created_at: string }[];
  const orgs = (results[1].data || []) as { id: string; created_at: string }[];
  const prompts = (results[2].data || []) as { id: string; scenario_type: string; created_at: string }[];
  const reports = (results[3].data || []) as { id: string; prompt_id: string; success: boolean; processing_time_ms: number | null; total_tokens: number | null; created_at: string }[];
  const intelRows = (results[4].data || []) as { id: string; query_type: string; success: boolean; processing_time_ms: number | null; created_at: string }[];
  const totalInsights = (results[5].data ?? 0) as number;
  const feedbackRows = (results[6].data || []) as FeedbackItem[];
  const chatRows = (results[7].data || []) as { id: string; rating: string; created_at: string }[];
  const totalFiles = (results[8].data ?? 0) as number;
  const totalTrackers = (results[9].data ?? 0) as number;

  // Scenario breakdown: join prompts + reports by prompt_id
  const promptTypeMap = new Map<string, string>();
  for (const p of prompts) {
    promptTypeMap.set(p.id, p.scenario_type);
  }

  const scenarioMap = new Map<string, { count: number; successes: number; totalTime: number; totalTokens: number; timeCount: number; tokenCount: number }>();
  for (const p of prompts) {
    if (!scenarioMap.has(p.scenario_type)) {
      scenarioMap.set(p.scenario_type, { count: 0, successes: 0, totalTime: 0, totalTokens: 0, timeCount: 0, tokenCount: 0 });
    }
    scenarioMap.get(p.scenario_type)!.count++;
  }

  for (const r of reports) {
    const type = promptTypeMap.get(r.prompt_id);
    if (!type) continue;
    const entry = scenarioMap.get(type);
    if (!entry) continue;
    if (r.success) entry.successes++;
    if (r.processing_time_ms != null) {
      entry.totalTime += r.processing_time_ms;
      entry.timeCount++;
    }
    if (r.total_tokens != null && r.total_tokens > 0) {
      entry.totalTokens += r.total_tokens;
      entry.tokenCount++;
    }
  }

  const scenarioBreakdown: ScenarioBreakdown[] = Array.from(scenarioMap.entries()).map(([type, s]) => ({
    type,
    count: s.count,
    successRate: s.count > 0 ? Math.round((s.successes / s.count) * 100) : 0,
    avgTimeMs: s.timeCount > 0 ? Math.round(s.totalTime / s.timeCount) : 0,
    avgTokens: s.tokenCount > 0 ? Math.round(s.totalTokens / s.tokenCount) : 0,
  }));

  // Intel breakdown
  const intelMap = new Map<string, { count: number; successes: number }>();
  for (const q of intelRows) {
    if (!intelMap.has(q.query_type)) {
      intelMap.set(q.query_type, { count: 0, successes: 0 });
    }
    const entry = intelMap.get(q.query_type)!;
    entry.count++;
    if (q.success) entry.successes++;
  }

  const intelBreakdown: IntelBreakdown[] = Array.from(intelMap.entries()).map(([type, s]) => ({
    type,
    count: s.count,
    successRate: s.count > 0 ? Math.round((s.successes / s.count) * 100) : 0,
  }));

  // Growth
  const userGrowth = groupByMonth(profiles);
  const orgGrowth = groupByMonth(orgs);

  // Feedback distribution
  const feedbackDistribution: Record<number, number> = {};
  let ratingSum = 0;
  for (const f of feedbackRows) {
    feedbackDistribution[f.rating] = (feedbackDistribution[f.rating] || 0) + 1;
    ratingSum += f.rating;
  }
  const avgRating = feedbackRows.length > 0 ? Math.round((ratingSum / feedbackRows.length) * 10) / 10 : 0;
  const latestFeedback = feedbackRows.slice(0, 5);

  // Chat feedback
  const chatThumbsUp = chatRows.filter((c) => c.rating === "up").length;
  const chatThumbsDown = chatRows.filter((c) => c.rating === "down").length;

  const refreshAll = () => {
    queryClient.invalidateQueries({
      predicate: (q) => (q.queryKey[0] as string).startsWith("analytics-"),
    });
  };

  return {
    totalUsers: profiles.length,
    totalOrgs: orgs.length,
    totalScenarios: prompts.length,
    totalIntelQueries: intelRows.length,
    scenarioBreakdown,
    intelBreakdown,
    userGrowth,
    orgGrowth,
    feedbackDistribution,
    avgRating,
    latestFeedback,
    chatThumbsUp,
    chatThumbsDown,
    totalFiles,
    totalInsights,
    totalTrackers,
    isLoading,
    error,
    refreshAll,
  };
}

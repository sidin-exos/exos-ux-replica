import { useQueries, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import * as XLSX from "xlsx";

// ─── types ───────────────────────────────────────────────────────────

export interface ScenarioBreakdown {
  type: string;
  count: number;
  successRate: number;
  avgTimeMs: number;
  avgTokens: number;
  satisfactionRate: number;
}

export interface IntelBreakdown {
  type: string;
  count: number;
  successRate: number;
}

export interface IndustryBreakdown {
  industry: string;
  count: number;
  successRate: number;
  avgTimeMs: number;
  avgTokens: number;
  satisfactionRate: number;
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

export interface RecentRun {
  id: string;
  scenario_type: string;
  industry_slug: string | null;
  category_slug: string | null;
  success: boolean;
  processing_time_ms: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  model: string;
  created_at: string;
}

export interface ChatbotSessionRow {
  id: string;
  bot_type: string;
  scenario_id: string | null;
  message_count: number;
  fields_extracted: number;
  fields_applied: boolean;
  navigation_action: string | null;
  error_count: number;
  duration_seconds: number | null;
  created_at: string;
  ended_at: string | null;
}

export type TimeRange = "24h" | "3d" | "7d" | "30d" | "all";

// ─── helpers ─────────────────────────────────────────────────────────

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

function getTimeFilterDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "3d": return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return new Date(0);
  }
}

type PromptRow = { id: string; scenario_type: string; created_at: string; industry_slug: string | null; category_slug: string | null };
type ReportRow = { id: string; prompt_id: string; success: boolean; processing_time_ms: number | null; total_tokens: number | null; created_at: string; model: string; prompt_tokens: number | null; completion_tokens: number | null };

function buildScenarioBreakdown(prompts: PromptRow[], reports: ReportRow[], feedback: FeedbackItem[]): ScenarioBreakdown[] {
  const promptTypeMap = new Map<string, string>();
  for (const p of prompts) promptTypeMap.set(p.id, p.scenario_type);

  const map = new Map<string, { count: number; successes: number; totalTime: number; totalTokens: number; timeCount: number; tokenCount: number; ratings: number[] }>();
  for (const p of prompts) {
    if (!map.has(p.scenario_type)) map.set(p.scenario_type, { count: 0, successes: 0, totalTime: 0, totalTokens: 0, timeCount: 0, tokenCount: 0, ratings: [] });
    map.get(p.scenario_type)!.count++;
  }
  for (const r of reports) {
    const type = promptTypeMap.get(r.prompt_id);
    if (!type) continue;
    const entry = map.get(type);
    if (!entry) continue;
    if (r.success) entry.successes++;
    if (r.processing_time_ms != null) { entry.totalTime += r.processing_time_ms; entry.timeCount++; }
    if (r.total_tokens != null && r.total_tokens > 0) { entry.totalTokens += r.total_tokens; entry.tokenCount++; }
  }
  for (const f of feedback) {
    const entry = map.get(f.scenario_id);
    if (entry) entry.ratings.push(f.rating);
  }
  return Array.from(map.entries()).map(([type, s]) => ({
    type,
    count: s.count,
    successRate: s.count > 0 ? Math.round((s.successes / s.count) * 100) : 0,
    avgTimeMs: s.timeCount > 0 ? Math.round(s.totalTime / s.timeCount) : 0,
    avgTokens: s.tokenCount > 0 ? Math.round(s.totalTokens / s.tokenCount) : 0,
    satisfactionRate: s.ratings.length > 0 ? Math.round((s.ratings.filter(r => r >= 7).length / s.ratings.length) * 100) : -1,
  }));
}

function buildIndustryBreakdown(prompts: PromptRow[], reports: ReportRow[], feedback: FeedbackItem[]): IndustryBreakdown[] {
  const promptIndustryMap = new Map<string, string>();
  const typeToIndustry = new Map<string, string>();
  for (const p of prompts) {
    promptIndustryMap.set(p.id, p.industry_slug || "Unknown");
    typeToIndustry.set(p.scenario_type, p.industry_slug || "Unknown");
  }

  const map = new Map<string, { count: number; successes: number; totalTime: number; totalTokens: number; timeCount: number; tokenCount: number; ratings: number[] }>();
  for (const p of prompts) {
    const industry = p.industry_slug || "Unknown";
    if (!map.has(industry)) map.set(industry, { count: 0, successes: 0, totalTime: 0, totalTokens: 0, timeCount: 0, tokenCount: 0, ratings: [] });
    map.get(industry)!.count++;
  }
  for (const r of reports) {
    const industry = promptIndustryMap.get(r.prompt_id) || "Unknown";
    const entry = map.get(industry);
    if (!entry) continue;
    if (r.success) entry.successes++;
    if (r.processing_time_ms != null) { entry.totalTime += r.processing_time_ms; entry.timeCount++; }
    if (r.total_tokens != null && r.total_tokens > 0) { entry.totalTokens += r.total_tokens; entry.tokenCount++; }
  }
  for (const f of feedback) {
    const industry = typeToIndustry.get(f.scenario_id) || "Unknown";
    map.get(industry)?.ratings.push(f.rating);
  }
  return Array.from(map.entries()).map(([industry, s]) => ({
    industry,
    count: s.count,
    successRate: s.count > 0 ? Math.round((s.successes / s.count) * 100) : 0,
    avgTimeMs: s.timeCount > 0 ? Math.round(s.totalTime / s.timeCount) : 0,
    avgTokens: s.tokenCount > 0 ? Math.round(s.totalTokens / s.tokenCount) : 0,
    satisfactionRate: s.ratings.length > 0 ? Math.round((s.ratings.filter(r => r >= 7).length / s.ratings.length) * 100) : -1,
  }));
}

// ─── main hook ───────────────────────────────────────────────────────

export function useAnalyticsDashboard(timeRange: TimeRange = "7d") {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      {
        queryKey: ["analytics-profiles"],
        queryFn: async () => {
          const { data, error } = await supabase.from("profiles").select("id, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-orgs"],
        queryFn: async () => {
          const { data, error } = await supabase.from("organizations").select("id, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-prompts"],
        queryFn: async () => {
          const { data, error } = await supabase.from("test_prompts").select("id, scenario_type, created_at, industry_slug, category_slug");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-reports"],
        queryFn: async () => {
          const { data, error } = await supabase.from("test_reports").select("id, prompt_id, success, processing_time_ms, total_tokens, created_at, model, prompt_tokens, completion_tokens");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-intel"],
        queryFn: async () => {
          const { data, error } = await supabase.from("intel_queries").select("id, query_type, success, processing_time_ms, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-insights"],
        queryFn: async () => {
          const { count, error } = await supabase.from("market_insights").select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
      {
        queryKey: ["analytics-scenario-feedback"],
        queryFn: async () => {
          const { data, error } = await supabase.from("scenario_feedback").select("id, scenario_id, rating, feedback_text, created_at").order("created_at", { ascending: false });
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-chat-feedback"],
        queryFn: async () => {
          const { data, error } = await supabase.from("chat_feedback").select("id, rating, created_at");
          if (error) throw error;
          return data || [];
        },
      },
      {
        queryKey: ["analytics-files"],
        queryFn: async () => {
          const { count, error } = await supabase.from("user_files").select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
      {
        queryKey: ["analytics-trackers"],
        queryFn: async () => {
          const { count, error } = await supabase.from("enterprise_trackers").select("id", { count: "exact", head: true });
          if (error) throw error;
          return count || 0;
        },
      },
      {
        queryKey: ["analytics-chatbot-sessions"],
        queryFn: async () => {
          const { data, error } = await supabase.from("chatbot_sessions")
            .select("id, bot_type, scenario_id, message_count, fields_extracted, fields_applied, navigation_action, error_count, duration_seconds, created_at, ended_at")
            .order("created_at", { ascending: false });
          if (error) throw error;
          return data || [];
        },
      },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error || null;

  const profiles = (results[0].data || []) as { id: string; created_at: string }[];
  const orgs = (results[1].data || []) as { id: string; created_at: string }[];
  const allPrompts = (results[2].data || []) as PromptRow[];
  const allReports = (results[3].data || []) as ReportRow[];
  const intelRows = (results[4].data || []) as { id: string; query_type: string; success: boolean; processing_time_ms: number | null; created_at: string }[];
  const totalInsights = (results[5].data ?? 0) as number;
  const feedbackRows = (results[6].data || []) as FeedbackItem[];
  const chatRows = (results[7].data || []) as { id: string; rating: string; created_at: string }[];
  const totalFiles = (results[8].data ?? 0) as number;
  const totalTrackers = (results[9].data ?? 0) as number;
  const chatbotSessions = (results[10].data || []) as ChatbotSessionRow[];

  // Time-filtered prompts & reports
  const cutoff = getTimeFilterDate(timeRange);
  const filteredPrompts = allPrompts.filter((p) => new Date(p.created_at) >= cutoff);
  const filteredPromptIds = new Set(filteredPrompts.map((p) => p.id));
  const filteredReports = allReports.filter((r) => filteredPromptIds.has(r.prompt_id));

  // Breakdowns (time-filtered)
  const scenarioBreakdown = buildScenarioBreakdown(filteredPrompts, filteredReports, feedbackRows);
  const industryBreakdown = buildIndustryBreakdown(filteredPrompts, filteredReports, feedbackRows);

  // Intel breakdown
  const intelMap = new Map<string, { count: number; successes: number }>();
  for (const q of intelRows) {
    if (!intelMap.has(q.query_type)) intelMap.set(q.query_type, { count: 0, successes: 0 });
    const entry = intelMap.get(q.query_type)!;
    entry.count++;
    if (q.success) entry.successes++;
  }
  const intelBreakdown: IntelBreakdown[] = Array.from(intelMap.entries()).map(([type, s]) => ({
    type,
    count: s.count,
    successRate: s.count > 0 ? Math.round((s.successes / s.count) * 100) : 0,
  }));

  // Recent 20 runs (time-filtered, joined)
  const reportByPromptId = new Map<string, ReportRow>();
  for (const r of allReports) {
    if (!reportByPromptId.has(r.prompt_id) || new Date(r.created_at) > new Date(reportByPromptId.get(r.prompt_id)!.created_at)) {
      reportByPromptId.set(r.prompt_id, r);
    }
  }
  const recentRuns: RecentRun[] = filteredPrompts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((p) => {
      const r = reportByPromptId.get(p.id);
      return {
        id: p.id,
        scenario_type: p.scenario_type,
        industry_slug: p.industry_slug,
        category_slug: p.category_slug,
        success: r?.success ?? false,
        processing_time_ms: r?.processing_time_ms ?? null,
        total_tokens: r?.total_tokens ?? null,
        prompt_tokens: r?.prompt_tokens ?? null,
        completion_tokens: r?.completion_tokens ?? null,
        model: r?.model ?? "—",
        created_at: p.created_at,
      };
    });

  // Recent 20 FAILED runs
  const recentFailedRuns: RecentRun[] = filteredPrompts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((p) => {
      const r = reportByPromptId.get(p.id);
      return r && !r.success;
    })
    .slice(0, 20)
    .map((p) => {
      const r = reportByPromptId.get(p.id)!;
      return {
        id: p.id,
        scenario_type: p.scenario_type,
        industry_slug: p.industry_slug,
        category_slug: p.category_slug,
        success: false,
        processing_time_ms: r.processing_time_ms ?? null,
        total_tokens: r.total_tokens ?? null,
        prompt_tokens: r.prompt_tokens ?? null,
        completion_tokens: r.completion_tokens ?? null,
        model: r.model ?? "—",
        created_at: p.created_at,
      };
    });

  const userGrowth = groupByMonth(profiles);
  const orgGrowth = groupByMonth(orgs);

  // Feedback
  const feedbackDistribution: Record<number, number> = {};
  let ratingSum = 0;
  for (const f of feedbackRows) {
    feedbackDistribution[f.rating] = (feedbackDistribution[f.rating] || 0) + 1;
    ratingSum += f.rating;
  }
  const avgRating = feedbackRows.length > 0 ? Math.round((ratingSum / feedbackRows.length) * 10) / 10 : 0;
  const latestFeedback = feedbackRows.slice(0, 5);

  // Satisfaction rate
  const satisfiedCount = feedbackRows.filter((f) => f.rating >= 7).length;
  const satisfactionRate = feedbackRows.length > 0 ? Math.round((satisfiedCount / feedbackRows.length) * 100) : 0;

  // Chat feedback
  const chatThumbsUp = chatRows.filter((c) => c.rating === "up").length;
  const chatThumbsDown = chatRows.filter((c) => c.rating === "down").length;

  // ─── Chatbot analytics ─────────────────────────────────────────────
  const guideSessions = chatbotSessions.filter((s) => s.bot_type === "guide");
  const assistantSessions = chatbotSessions.filter((s) => s.bot_type === "scenario_assistant");

  const totalChatbotSessions = chatbotSessions.length;
  const avgMessagesPerSession = chatbotSessions.length > 0
    ? Math.round((chatbotSessions.reduce((sum, s) => sum + s.message_count, 0) / chatbotSessions.length) * 10) / 10
    : 0;
  const fieldExtractionRate = assistantSessions.length > 0
    ? Math.round((assistantSessions.filter((s) => s.fields_extracted > 0).length / assistantSessions.length) * 100)
    : 0;
  const applyToFormRate = assistantSessions.length > 0
    ? Math.round((assistantSessions.filter((s) => s.fields_applied).length / assistantSessions.length) * 100)
    : 0;
  const navigationRate = guideSessions.length > 0
    ? Math.round((guideSessions.filter((s) => s.navigation_action).length / guideSessions.length) * 100)
    : 0;
  const chatbotErrorRate = chatbotSessions.length > 0
    ? Math.round((chatbotSessions.filter((s) => s.error_count > 0).length / chatbotSessions.length) * 100)
    : 0;
  const avgSessionDuration = chatbotSessions.filter((s) => s.duration_seconds != null).length > 0
    ? Math.round(chatbotSessions.filter((s) => s.duration_seconds != null).reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / chatbotSessions.filter((s) => s.duration_seconds != null).length)
    : 0;
  const avgFieldsPerSession = assistantSessions.length > 0
    ? Math.round((assistantSessions.reduce((sum, s) => sum + s.fields_extracted, 0) / assistantSessions.length) * 10) / 10
    : 0;

  // Scenario assistant breakdown by scenario_id
  const scenarioAssistantByType = new Map<string, { count: number; fieldsTotal: number; applied: number }>();
  for (const s of assistantSessions) {
    const key = s.scenario_id || "Unknown";
    if (!scenarioAssistantByType.has(key)) scenarioAssistantByType.set(key, { count: 0, fieldsTotal: 0, applied: 0 });
    const entry = scenarioAssistantByType.get(key)!;
    entry.count++;
    entry.fieldsTotal += s.fields_extracted;
    if (s.fields_applied) entry.applied++;
  }
  const chatbotScenarioBreakdown = Array.from(scenarioAssistantByType.entries()).map(([scenario, s]) => ({
    scenario,
    sessions: s.count,
    avgFields: s.count > 0 ? Math.round((s.fieldsTotal / s.count) * 10) / 10 : 0,
    applyRate: s.count > 0 ? Math.round((s.applied / s.count) * 100) : 0,
  }));

  // Top navigation destinations
  const navDestMap = new Map<string, number>();
  for (const s of guideSessions) {
    if (s.navigation_action) navDestMap.set(s.navigation_action, (navDestMap.get(s.navigation_action) || 0) + 1);
  }
  const topNavigationDestinations = Array.from(navDestMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Recent 20 chatbot sessions
  const recentChatbotSessions = chatbotSessions.slice(0, 20);

  // Sessions over time (grouped by day)
  const sessionsOverTime = (() => {
    const dayMap = new Map<string, { guide: number; assistant: number }>();
    for (const s of chatbotSessions) {
      const day = format(new Date(s.created_at), "yyyy-MM-dd");
      if (!dayMap.has(day)) dayMap.set(day, { guide: 0, assistant: 0 });
      const entry = dayMap.get(day)!;
      if (s.bot_type === "guide") entry.guide++;
      else entry.assistant++;
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, counts]) => ({ day, ...counts }));
  })();

  // Raw data export
  const exportRawData = () => {
    const wb = XLSX.utils.book_new();

    const runsData = allPrompts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p) => {
        const r = reportByPromptId.get(p.id);
        return {
          Date: new Date(p.created_at).toLocaleString(),
          "Scenario Type": p.scenario_type,
          Industry: p.industry_slug || "",
          Category: p.category_slug || "",
          Success: r?.success ? "Yes" : "No",
          "Processing Time (ms)": r?.processing_time_ms ?? "",
          "Total Tokens": r?.total_tokens ?? "",
          "Prompt Tokens": r?.prompt_tokens ?? "",
          "Completion Tokens": r?.completion_tokens ?? "",
          Model: r?.model ?? "",
        };
      });
    if (runsData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(runsData), "Scenario Runs");
    }

    if (feedbackRows.length > 0) {
      const fbData = feedbackRows.map((f) => ({
        Date: new Date(f.created_at).toLocaleString(),
        "Scenario ID": f.scenario_id,
        Rating: f.rating,
        Feedback: f.feedback_text || "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fbData), "Scenario Feedback");
    }

    if (intelRows.length > 0) {
      const intelData = intelRows.map((q) => ({
        Date: new Date(q.created_at).toLocaleString(),
        "Query Type": q.query_type,
        Success: q.success ? "Yes" : "No",
        "Processing Time (ms)": q.processing_time_ms ?? "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(intelData), "Intel Queries");
    }

    if (chatRows.length > 0) {
      const chatData = chatRows.map((c) => ({
        Date: new Date(c.created_at!).toLocaleString(),
        Rating: c.rating,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chatData), "Chat Feedback");
    }

    // Chatbot sessions sheet
    if (chatbotSessions.length > 0) {
      const sessionData = chatbotSessions.map((s) => ({
        Date: new Date(s.created_at).toLocaleString(),
        "Bot Type": s.bot_type,
        "Scenario": s.scenario_id || "",
        "Messages": s.message_count,
        "Fields Extracted": s.fields_extracted,
        "Fields Applied": s.fields_applied ? "Yes" : "No",
        "Navigation": s.navigation_action || "",
        "Errors": s.error_count,
        "Duration (s)": s.duration_seconds ?? "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionData), "Chatbot Sessions");
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `EXOS_Analytics_RawData_${dateStr}.xlsx`);
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({
      predicate: (q) => (q.queryKey[0] as string).startsWith("analytics-"),
    });
  };

  return {
    totalUsers: profiles.length,
    totalOrgs: orgs.length,
    totalScenarios: filteredPrompts.length,
    totalIntelQueries: intelRows.length,
    scenarioBreakdown,
    industryBreakdown,
    intelBreakdown,
    recentRuns,
    recentFailedRuns,
    userGrowth,
    orgGrowth,
    feedbackDistribution,
    avgRating,
    satisfactionRate,
    latestFeedback,
    chatThumbsUp,
    chatThumbsDown,
    totalFiles,
    totalInsights,
    totalTrackers,
    // Chatbot metrics
    totalChatbotSessions,
    guideSessions: guideSessions.length,
    assistantSessions: assistantSessions.length,
    avgMessagesPerSession,
    fieldExtractionRate,
    applyToFormRate,
    navigationRate,
    chatbotErrorRate,
    avgSessionDuration,
    avgFieldsPerSession,
    chatbotScenarioBreakdown,
    topNavigationDestinations,
    recentChatbotSessions,
    sessionsOverTime,
    isLoading,
    error,
    refreshAll,
    exportRawData,
  };
}

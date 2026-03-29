import { useState, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { isAuthError, showAuthErrorToast } from "@/lib/auth-utils";

export type QueryType = 'supplier' | 'commodity' | 'industry' | 'regulatory' | 'm&a' | 'risk';
export type RecencyFilter = 'day' | 'week' | 'month' | 'year';

export interface Citation {
  index: number;
  url: string;
}

export interface IntelQueryParams {
  queryType: QueryType;
  query: string;
  recencyFilter?: RecencyFilter;
  domainFilter?: string[];
  context?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface IntelResult {
  success: boolean;
  summary: string;
  citations: Citation[];
  queryType: QueryType;
  processingTimeMs: number;
  model: string;
  tokenUsage?: TokenUsage | null;
}

export interface IntelQuery {
  id: string;
  created_at: string;
  query_type: QueryType;
  query_text: string;
  recency_filter: RecencyFilter | null;
  domain_filter: string[] | null;
  summary: string | null;
  citations: Citation[] | null;
  processing_time_ms: number | null;
  success: boolean;
}

export const QUERY_TYPE_LABELS: Record<QueryType, { label: string; description: string; icon: string }> = {
  supplier: {
    label: "Supplier News",
    description: "Monitor supplier financial health, operations, and strategic moves",
    icon: "Building2"
  },
  commodity: {
    label: "Commodity Watch",
    description: "Track raw material prices, supply constraints, and market outlook",
    icon: "TrendingUp"
  },
  industry: {
    label: "Industry Trends",
    description: "Analyze market dynamics, competition, and technology shifts",
    icon: "BarChart3"
  },
  regulatory: {
    label: "Regulatory Updates",
    description: "Monitor compliance requirements and policy changes",
    icon: "Scale"
  },
  "m&a": {
    label: "M&A Activity",
    description: "Track mergers, acquisitions, and market consolidation",
    icon: "GitMerge"
  },
  risk: {
    label: "Risk Signals",
    description: "Identify supply chain disruptions and early warning signs",
    icon: "AlertTriangle"
  }
};

export const RECENCY_OPTIONS: { value: RecencyFilter; label: string }[] = [
  { value: "day", label: "Past 24 hours" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

export const DOMAIN_OPTIONS = [
  { value: "reuters.com", label: "Reuters" },
  { value: "bloomberg.com", label: "Bloomberg" },
  { value: "wsj.com", label: "Wall Street Journal" },
  { value: "ft.com", label: "Financial Times" },
  { value: "spglobal.com", label: "S&P Global" },
  { value: "supplychaindive.com", label: "Supply Chain Dive" },
];

export function useMarketIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntelResult | null>(null);
  const [recentQueries, setRecentQueries] = useState<IntelQuery[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const query = useCallback(async (params: IntelQueryParams): Promise<IntelResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("market-intelligence", {
        body: params,
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Query failed");
      }

      setResult(data);
      return data;
    } catch (err) {
      if (isAuthError(err)) {
        showAuthErrorToast();
      } else {
        Sentry.captureException(err, {
          tags: { feature: "market-intelligence", queryType: params.queryType },
        });
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to query market intelligence";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRecentQueries = useCallback(async (limit = 10) => {
    setIsLoadingHistory(true);
    try {
      const { data, error: queryError } = await supabase
        .from("intel_queries")
        .select("*")
        .eq("success", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (queryError) {
        console.error("Failed to load recent queries:", queryError);
        return;
      }

      // Type assertion since we know the structure matches
      setRecentQueries((data || []) as unknown as IntelQuery[]);
    } catch (err) {
      console.error("Failed to load recent queries:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    query,
    isLoading,
    error,
    result,
    recentQueries,
    isLoadingHistory,
    loadRecentQueries,
    clearResult,
  };
}

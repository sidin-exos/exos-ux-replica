import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketInsightRowSchema, type MarketInsightParsed, safeParseJsonb } from "@/lib/jsonb-schemas";

export type MarketInsight = MarketInsightParsed;

export interface MarketInsightsSummary {
  total: number;
  successful: number;
  failed: number;
  processingTimeMs: number;
  totalTokens: number;
  estimatedCost: string;
}

/**
 * Fetch available market insights for a specific industry+category combination
 */
export function useMarketInsight(industrySlug: string | null, categorySlug: string | null) {
  return useQuery({
    queryKey: ["market-insight", industrySlug, categorySlug],
    queryFn: async (): Promise<MarketInsight | null> => {
      if (!industrySlug || !categorySlug) return null;

      const { data, error } = await supabase
        .from("market_insights")
        .select("*")
        .eq("industry_slug", industrySlug)
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching market insight:", error);
        throw error;
      }

      if (data) {
        return safeParseJsonb(MarketInsightRowSchema, data, "market-insight", null);
      }

      return null;
    },
    enabled: !!industrySlug && !!categorySlug,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

/**
 * Fetch all active market insights
 */
export function useAllMarketInsights() {
  return useQuery({
    queryKey: ["market-insights-all"],
    queryFn: async (): Promise<MarketInsight[]> => {
      const { data, error } = await supabase
        .from("market_insights")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching market insights:", error);
        throw error;
      }

      return (data || [])
        .map(item => safeParseJsonb(MarketInsightRowSchema, item, "market-insights-all", null))
        .filter((item): item is MarketInsight => item !== null);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Fetch archived market insights for a combination
 */
export function useMarketInsightHistory(industrySlug: string | null, categorySlug: string | null) {
  return useQuery({
    queryKey: ["market-insight-history", industrySlug, categorySlug],
    queryFn: async (): Promise<MarketInsight[]> => {
      if (!industrySlug || !categorySlug) return [];

      const { data, error } = await supabase
        .from("market_insights")
        .select("*")
        .eq("industry_slug", industrySlug)
        .eq("category_slug", categorySlug)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching market insight history:", error);
        throw error;
      }

      return (data || [])
        .map(item => safeParseJsonb(MarketInsightRowSchema, item, "market-insight-history", null))
        .filter((item): item is MarketInsight => item !== null);
    },
    enabled: !!industrySlug && !!categorySlug,
  });
}

/**
 * Generate new market insights via edge function
 */
export function useGenerateMarketInsights() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    summary?: MarketInsightsSummary;
    error?: string;
  } | null>(null);

  const generate = useCallback(async (combinations?: Array<{
    industrySlug: string;
    industryName: string;
    categorySlug: string;
    categoryName: string;
  }>, validateOnly = false) => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-market-insights", {
        body: { combinations, validateOnly },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      setGenerationResult({
        success: true,
        summary: data.summary,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["market-insight"] });
      queryClient.invalidateQueries({ queryKey: ["market-insights-all"] });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate insights";
      setGenerationResult({
        success: false,
        error: errorMessage,
      });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient]);

  return {
    generate,
    isGenerating,
    generationResult,
    clearResult: () => setGenerationResult(null),
  };
}

/**
 * Check if market insights are available for current context
 */
export function useMarketInsightsAvailability(industrySlug: string | null, categorySlug: string | null) {
  const { data: insight, isLoading } = useMarketInsight(industrySlug, categorySlug);

  return {
    isAvailable: !!insight,
    insight,
    isLoading,
    lastUpdated: insight?.created_at ? new Date(insight.created_at) : null,
  };
}

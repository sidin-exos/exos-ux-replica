import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccuracyTrendPoint {
  batch_date: string;
  total_runs: number;
  accuracy: number; // 0-1 decimal (converted from percentage)
  avg_processing_time_ms: number | null;
}

export interface EvolutionaryDirective {
  target_scenario: string;
  directive_text: string;
  source_field_action: string;
  occurrence_count: number;
}

export function useAccuracyTrend() {
  return useQuery({
    queryKey: ["pipeline-iq", "accuracy-trend"],
    queryFn: async (): Promise<AccuracyTrendPoint[]> => {
      // View isn't in generated types — use raw query via .from() with type assertion
      const { data, error } = await supabase
        .from("pipeline_iq_stats" as any)
        .select("*")
        .order("batch_date", { ascending: true });

      if (error) throw error;

      return ((data as any[]) ?? []).map((row) => ({
        batch_date: row.batch_date,
        total_runs: Number(row.total_runs),
        accuracy: Number(row.accuracy) / 100, // percentage → decimal
        avg_processing_time_ms: row.avg_processing_time_ms
          ? Number(row.avg_processing_time_ms)
          : null,
      }));
    },
    staleTime: 60_000,
  });
}

export function useEvolutionaryDirectives(limit = 5) {
  return useQuery({
    queryKey: ["pipeline-iq", "directives", limit],
    queryFn: async (): Promise<EvolutionaryDirective[]> => {
      const { data, error } = await supabase.rpc(
        "get_evolutionary_directives" as any,
        { limit_num: limit }
      );

      if (error) throw error;

      return ((data as any[]) ?? []).map((row) => ({
        target_scenario: row.target_scenario,
        directive_text: row.directive_text,
        source_field_action: row.source_field_action,
        occurrence_count: Number(row.occurrence_count),
      }));
    },
    staleTime: 60_000,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const QUERY_KEY = ["founder-metrics"];

interface MetricsUpdate {
  mrr: number;
  active_users: number;
  burn_rate: number;
  runway_months: number;
}

export function useFounderMetrics() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("founder_metrics")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: MetricsUpdate) => {
      // Get the single row's id first
      const { data: existing } = await supabase
        .from("founder_metrics")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) throw new Error("No metrics row found");

      const { error } = await supabase
        .from("founder_metrics")
        .update(update)
        .eq("id", existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Metrics updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update metrics", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateHypothesis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (strategic_hypothesis: string) => {
      const { data: existing } = await supabase
        .from("founder_metrics")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) throw new Error("No metrics row found");

      const { error } = await supabase
        .from("founder_metrics")
        .update({ strategic_hypothesis })
        .eq("id", existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Hypothesis updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update hypothesis", description: err.message, variant: "destructive" });
    },
  });
}

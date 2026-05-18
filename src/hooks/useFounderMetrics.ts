import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

const QUERY_KEY = ["founder-metrics"];

type FounderMetrics = Database["public"]["Tables"]["founder_metrics"]["Row"];

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
      // Route through the SECURITY DEFINER RPC so the super-admin
      // check is enforced server-side regardless of RLS state on
      // the underlying founder_metrics table (audit issue #17).
      // The RPC returns SETOF founder_metrics; the table has a
      // single row, so we take the first entry.
      const { data, error } = await supabase.rpc("get_founder_metrics");

      if (error) throw error;
      const rows = (data ?? []) as FounderMetrics[];
      return rows[0] ?? null;
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

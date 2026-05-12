import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

// Helper: typed `.rpc()` shim. The auto-generated Database types do
// not yet include the SECURITY DEFINER admin wrappers introduced for
// audit issue #17, so we narrow the call shape manually here.
type AdminRpc = {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: Error | null }>;
};
const adminRpc = supabase as unknown as AdminRpc;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CoachingCard = Tables<"coaching_cards">;
type FieldConfig = Tables<"scenario_field_config">;
type MethodologyConfig = Tables<"methodology_config">;
type ChangeLogEntry = Tables<"methodology_change_log">;

export type { CoachingCard, FieldConfig, MethodologyConfig, ChangeLogEntry };

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCoachingCards() {
  return useQuery({
    queryKey: ["methodology", "coaching-cards"],
    queryFn: async () => {
      // SECURITY DEFINER RPC enforces super_admin check (audit #17).
      const { data, error } = await adminRpc.rpc("get_coaching_cards");
      if (error) throw error;
      return (data ?? []) as CoachingCard[];
    },
  });
}

export function useCoachingCard(slug: string) {
  return useQuery({
    queryKey: ["methodology", "coaching-card", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_cards")
        .select("*")
        .eq("scenario_slug", slug)
        .single();

      if (error) throw error;
      return data as CoachingCard;
    },
    enabled: !!slug,
  });
}

export function useFieldConfigs(slug: string) {
  return useQuery({
    queryKey: ["methodology", "field-config", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenario_field_config")
        .select("*")
        .eq("scenario_slug", slug)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FieldConfig[];
    },
    enabled: !!slug,
  });
}

export function useMethodologyConfigs() {
  return useQuery({
    queryKey: ["methodology", "config"],
    queryFn: async () => {
      // SECURITY DEFINER RPC enforces super_admin check (audit #17).
      const { data, error } = await adminRpc.rpc("get_methodology_configs");
      if (error) throw error;
      return (data ?? []) as MethodologyConfig[];
    },
  });
}

export function useMethodologyChangeLog(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["methodology", "change-log", page],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      // SECURITY DEFINER RPC enforces super_admin check (audit #17).
      // Returns rows shaped as { entry: <row>, total_count: bigint }.
      const { data, error } = await adminRpc.rpc("get_methodology_change_log", {
        p_offset: offset,
        p_limit: pageSize,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ entry: ChangeLogEntry; total_count: number }>;
      const entries = rows.map((r) => r.entry);
      const totalCount = rows[0]?.total_count ?? 0;
      return { entries, totalCount: Number(totalCount) };
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useUpdateCoachingCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: Partial<CoachingCard>;
    }) => {
      const { error } = await supabase
        .from("coaching_cards")
        .update(updates)
        .eq("scenario_slug", slug);

      if (error) throw error;
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["methodology", "coaching-cards"] });
      queryClient.invalidateQueries({ queryKey: ["methodology", "coaching-card", slug] });
      toast.success("Coaching card saved");
    },
    onError: (err: Error) => {
      toast.error("Failed to save coaching card: " + err.message);
    },
  });
}

export function useUpdateFieldConfigs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      blocks,
    }: {
      slug: string;
      blocks: { id: string; updates: Partial<FieldConfig> }[];
    }) => {
      for (const block of blocks) {
        const { error } = await supabase
          .from("scenario_field_config")
          .update(block.updates)
          .eq("id", block.id);

        if (error) throw error;
      }
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["methodology", "field-config", slug] });
      toast.success("Field configuration saved");
    },
    onError: (err: Error) => {
      toast.error("Failed to save field configuration: " + err.message);
    },
  });
}

export function useUpdateMethodologyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("methodology_config")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["methodology", "config"] });
      toast.success("Configuration saved");
    },
    onError: (err: Error) => {
      toast.error("Failed to save configuration: " + err.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

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
      const { data, error } = await supabase
        .from("coaching_cards")
        .select("*")
        .order("scenario_id");

      if (error) throw error;
      return data as CoachingCard[];
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
      const { data, error } = await supabase
        .from("methodology_config")
        .select("*")
        .order("key");

      if (error) throw error;
      return data as MethodologyConfig[];
    },
  });
}

export function useMethodologyChangeLog(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["methodology", "change-log", page],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("methodology_change_log")
        .select("*", { count: "exact" })
        .order("changed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { entries: data as ChangeLogEntry[], totalCount: count ?? 0 };
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

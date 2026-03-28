import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedIntelConfig {
  id: string;
  user_id: string;
  config_type: "scheduled" | "triggered";
  name: string;
  query_type: string;
  query_text: string;
  recency_filter: string | null;
  domain_filter: string[] | null;
  context: string | null;
  schedule_cron: string | null;
  trigger_instruction: string | null;
  grounding_target: Record<string, string> | null;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface CreateIntelConfigParams {
  config_type: "scheduled" | "triggered";
  name: string;
  query_type: string;
  query_text: string;
  recency_filter?: string;
  domain_filter?: string[];
  context?: string;
  schedule_cron?: string;
  trigger_instruction?: string;
  grounding_target?: Record<string, string>;
}

export function useSavedIntelConfigs() {
  const [configs, setConfigs] = useState<SavedIntelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConfigs = useCallback(async (configType?: "scheduled" | "triggered") => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConfigs([]);
        return;
      }

      let query = supabase
        .from("saved_intel_configs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (configType) {
        query = query.eq("config_type", configType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConfigs((data ?? []) as SavedIntelConfig[]);
    } catch (err) {
      console.error("Error loading intel configs:", err);
      toast.error("Failed to load saved configurations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConfig = useCallback(async (params: CreateIntelConfigParams): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save configurations");
        return false;
      }

      const { error } = await (supabase.from as any)("saved_intel_configs")
        .insert({
          user_id: user.id,
          config_type: params.config_type,
          name: params.name,
          query_type: params.query_type,
          query_text: params.query_text,
          recency_filter: params.recency_filter || null,
          domain_filter: params.domain_filter || null,
          context: params.context || null,
          schedule_cron: params.schedule_cron || null,
          trigger_instruction: params.trigger_instruction || null,
          grounding_target: params.grounding_target || {},
        });

      if (error) throw error;
      toast.success("Configuration saved successfully");
      return true;
    } catch (err) {
      console.error("Error creating intel config:", err);
      toast.error("Failed to save configuration");
      return false;
    }
  }, []);

  const deleteConfig = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("saved_intel_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setConfigs(prev => prev.filter(c => c.id !== id));
      toast.success("Configuration deleted");
      return true;
    } catch (err) {
      console.error("Error deleting intel config:", err);
      toast.error("Failed to delete configuration");
      return false;
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("saved_intel_configs")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
      toast.success(isActive ? "Configuration activated" : "Configuration paused");
      return true;
    } catch (err) {
      console.error("Error toggling intel config:", err);
      toast.error("Failed to update configuration");
      return false;
    }
  }, []);

  return { configs, isLoading, loadConfigs, createConfig, deleteConfig, toggleActive };
}

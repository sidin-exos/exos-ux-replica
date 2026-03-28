import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { isAuthError, showAuthErrorToast } from "@/lib/auth-utils";

export type TrackerType = "risk" | "inflation";
export type TrackerStatus = "setup" | "active" | "paused";
export type MonitorType = "DM-1" | "DM-2" | "DM-3" | "DM-4" | "DM-5";
export type EntityType = "supplier" | "category" | "contract" | "project" | "country";
export type ComparisonPeriod = "WoW" | "MoM" | "QoQ" | "YoY";

export type DrsBand = "A" | "B" | "C" | "D" | "E";

export function getDrsBand(score: number): DrsBand {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "E";
}

export const DRS_BAND_META: Record<DrsBand, { label: string; color: string; range: string }> = {
  A: { label: "Resilient", color: "text-emerald-600", range: "85–100" },
  B: { label: "Stable with Watch Items", color: "text-blue-600", range: "70–84" },
  C: { label: "Elevated Attention", color: "text-amber-600", range: "50–69" },
  D: { label: "Material Risk", color: "text-orange-600", range: "30–49" },
  E: { label: "Critical", color: "text-destructive", range: "0–29" },
};

export const MONITOR_TYPE_META: Record<MonitorType, { label: string; purpose: string; drs: boolean; phase: 1 | 2 }> = {
  "DM-1": { label: "Hypothesis Testing", purpose: "Test a procurement hypothesis with balanced for/against evidence", drs: false, phase: 1 },
  "DM-2": { label: "Risk Assessment", purpose: "Scored multi-dimensional risk assessment for a specific entity", drs: true, phase: 1 },
  "DM-3": { label: "Risk Dynamics", purpose: "Track DRS trajectory over time across comparison periods", drs: true, phase: 1 },
  "DM-4": { label: "Country / Region", purpose: "Monitor geopolitical, regulatory, and logistics risk by geography", drs: true, phase: 1 },
  "DM-5": { label: "Industry Dynamics", purpose: "Track industry-level risk signals and structural shifts", drs: true, phase: 1 },
};

export interface EnterpriseTracker {
  id: string;
  user_id: string;
  tracker_type: TrackerType;
  name: string;
  status: TrackerStatus;
  parameters: Record<string, unknown>;
  file_references: string[];
  created_at: string;
}

/** Extended parameters stored in the JSONB `parameters` column */
export interface MonitorParameters {
  monitor_type?: MonitorType;
  entity_type?: EntityType;
  default_period?: ComparisonPeriod;
  dimension_weights?: Record<string, number>;
  alert_thresholds?: Record<string, number>;
  [key: string]: unknown;
}

interface CreateTrackerInput {
  name: string;
  tracker_type: TrackerType;
  parameters: Record<string, unknown>;
  files: File[];
}

export function useEnterpriseTrackers(trackerType: TrackerType) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["enterprise_trackers", trackerType];

  const { data: trackers = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("enterprise_trackers")
        .select("*")
        .eq("tracker_type", trackerType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as EnterpriseTracker[];
    },
    enabled: !!user,
  });

  const createTracker = useMutation({
    mutationFn: async (input: CreateTrackerInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload files
      const fileRefs: string[] = [];
      for (const file of input.files) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("tracker-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        fileRefs.push(path);
      }

      // Insert tracker row
      const row = {
        user_id: user.id,
        tracker_type: input.tracker_type,
        name: input.name,
        status: "active",
        parameters: input.parameters,
        file_references: fileRefs,
      };
      const { data, error } = await supabase
        .from("enterprise_trackers")
        .insert(row as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EnterpriseTracker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Monitor activated",
        description: "Your monitor has been created and is now active.",
      });
    },
    onError: (err: Error) => {
      if (isAuthError(err)) {
        showAuthErrorToast();
        return;
      }
      toast({
        title: "Failed to create monitor",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return { trackers, isLoading, createTracker };
}

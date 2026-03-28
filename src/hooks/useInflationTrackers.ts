import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { isAuthError, showAuthErrorToast } from "@/lib/auth-utils";

export type DriverStatus = "improving" | "stable" | "deteriorating";
export type DriverSource = "ai_proposed" | "user_defined";

export interface InflationDriver {
  id: string;
  tracker_id: string;
  organization_id: string;
  driver_name: string;
  rationale: string | null;
  source: DriverSource;
  weight: number | null;
  trigger_description: string | null;
  scan_cadence: string;
  enrichment_cadence: string;
  current_status: DriverStatus;
  context_summary: string | null;
  last_scanned_at: string | null;
  last_enriched_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InflationTracker {
  id: string;
  organization_id: string;
  created_by: string;
  goods_definition: string;
  driver_count_target: number;
  is_active: boolean;
  created_at: string;
  drivers: InflationDriver[];
}

export interface DriverInput {
  driver_name: string;
  rationale: string | null;
  source: DriverSource;
  weight: number | null;
  trigger_description: string | null;
}

interface CreateTrackerInput {
  goods_definition: string;
  driver_count_target: number;
  scan_cadence?: string;
  drivers: DriverInput[];
}

export function useInflationTrackers() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["inflation_trackers"];

  const { data: trackers = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data: trackerRows, error: tErr } = await supabase
        .from("inflation_trackers")
        .select("*")
        .order("created_at", { ascending: false });

      if (tErr) throw tErr;

      const { data: driverRows, error: dErr } = await supabase
        .from("inflation_drivers")
        .select("*")
        .order("created_at", { ascending: true });

      if (dErr) throw dErr;

      const driversByTracker = new Map<string, InflationDriver[]>();
      for (const d of (driverRows ?? [])) {
        const list = driversByTracker.get(d.tracker_id) ?? [];
        list.push(d as unknown as InflationDriver);
        driversByTracker.set(d.tracker_id, list);
      }

      return ((trackerRows ?? []) as unknown as Omit<InflationTracker, "drivers">[]).map(t => ({
        ...t,
        drivers: driversByTracker.get(t.id) ?? [],
      }));
    },
    enabled: !!user,
  });

  const createTracker = useMutation({
    mutationFn: async (input: CreateTrackerInput) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data: tracker, error: tErr } = await supabase
        .from("inflation_trackers")
        .insert({
          created_by: currentUser.id,
          goods_definition: input.goods_definition,
          driver_count_target: input.driver_count_target,
        } as any)
        .select()
        .single();

      if (tErr) throw tErr;

      if (input.drivers.length > 0) {
        const cadence = input.scan_cadence || "twice_weekly";
        const driverRows = input.drivers.map(d => ({
          tracker_id: (tracker as any).id,
          driver_name: d.driver_name,
          rationale: d.rationale,
          source: d.source,
          weight: d.weight,
          trigger_description: d.trigger_description,
          scan_cadence: cadence,
        }));

        const { error: dErr } = await supabase
          .from("inflation_drivers")
          .insert(driverRows as any);

        if (dErr) throw dErr;
      }

      return tracker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Tracker activated",
        description: "Your inflation tracker and drivers are now active.",
      });
    },
    onError: (err: Error) => {
      if (isAuthError(err)) {
        showAuthErrorToast();
        return;
      }
      toast({
        title: "Failed to create tracker",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return { trackers, isLoading, createTracker };
}

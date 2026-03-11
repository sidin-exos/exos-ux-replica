import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { isAuthError, showAuthErrorToast } from "@/lib/auth-utils";

export type TrackerType = "risk" | "inflation";
export type TrackerStatus = "setup" | "active" | "paused";

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
        title: "Tracker activated",
        description: "Your tracker has been created and is now active.",
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

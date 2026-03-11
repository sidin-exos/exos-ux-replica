import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

export interface ScenarioFileAttachment {
  id: string;
  user_id: string;
  organization_id: string;
  file_id: string;
  scenario_type: string;
  scenario_run_id: string;
  attached_at: string;
}

export function useScenarioFileAttachments(scenarioRunId?: string) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const queryKey = ["scenario_file_attachments", scenarioRunId];

  // Fetch attachments for a specific scenario run
  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!scenarioRunId) return [];

      const { data, error } = await supabase
        .from("scenario_file_attachments")
        .select("*")
        .eq("scenario_run_id", scenarioRunId)
        .order("attached_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ScenarioFileAttachment[];
    },
    enabled: !!user && !!scenarioRunId,
  });

  // Bulk attach files to a scenario run
  const attachFiles = useMutation({
    mutationFn: async ({
      runId,
      scenarioType,
      fileIds,
    }: {
      runId: string;
      scenarioType: string;
      fileIds: string[];
    }) => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      if (fileIds.length === 0) return [];

      // Verify file ownership — all files must exist and belong to user's org
      // RLS on user_files ensures we only see files in our org
      const { data: ownedFiles, error: verifyError } = await supabase
        .from("user_files")
        .select("id")
        .in("id", fileIds);

      if (verifyError) throw verifyError;

      const ownedIds = new Set((ownedFiles ?? []).map((f: { id: string }) => f.id));
      const unauthorized = fileIds.filter((id) => !ownedIds.has(id));
      if (unauthorized.length > 0) {
        throw new Error("One or more files not found or unauthorized");
      }

      const rows = fileIds.map((fileId) => ({
        user_id: currentUser.id,
        file_id: fileId,
        scenario_type: scenarioType,
        scenario_run_id: runId,
      }));

      const { data, error } = await supabase
        .from("scenario_file_attachments")
        .insert(rows as any)
        .select();

      if (error) throw error;
      return (data ?? []) as unknown as ScenarioFileAttachment[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Detach a single file
  const detachFile = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase
        .from("scenario_file_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    attachments,
    isLoading,
    attachFiles,
    detachFile,
  };
}

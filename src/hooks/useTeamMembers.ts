import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  role: "admin" | "manager" | "user";
  created_at: string;
}

export function useTeamMembers(organizationId: string | null | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["team-members", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, job_title, role, created_at")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TeamMember[];
    },
    enabled: !!organizationId && enabled,
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "user" | "manager" | "admin" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    },
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    updateRole,
  };
}

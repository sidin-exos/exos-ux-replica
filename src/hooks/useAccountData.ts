import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";

export interface ProfileData {
  id: string;
  display_name: string | null;
  full_name: string | null;
  job_title: string | null;
  company_name: string | null;
  company_size: string | null;
  country: string | null;
  industry: string | null;
  primary_challenge: string | null;
  business_context: string | null;
  organization_id: string | null;
  role: string;
  created_at: string;
  subscription_status: string | null;
  subscription_price_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface UsageStats {
  fileCount: number;
}

export function useAccountData() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const profileQuery = useQuery({
    queryKey: ["account-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as unknown as ProfileData;
    },
    enabled: !!user,
  });

  const orgQuery = useQuery({
    queryKey: ["account-org", profileQuery.data?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profileQuery.data!.organization_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileQuery.data?.organization_id,
  });

  const usageQuery = useQuery({
    queryKey: ["account-usage", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_files")
        .select("id", { count: "exact", head: true });
      return { fileCount: count ?? 0 } as UsageStats;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ProfileData>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const emptyFieldCount = profileQuery.data
    ? [
        profileQuery.data.full_name,
        profileQuery.data.job_title,
        profileQuery.data.company_name,
        profileQuery.data.company_size,
        profileQuery.data.country,
        profileQuery.data.industry,
        profileQuery.data.primary_challenge,
      ].filter((v) => !v).length
    : 0;

  return {
    profile: profileQuery.data ?? null,
    orgName: orgQuery.data?.name ?? null,
    usage: usageQuery.data ?? { fileCount: 0 },
    isLoading: profileQuery.isLoading,
    emptyFieldCount,
    updateProfile,
  };
}

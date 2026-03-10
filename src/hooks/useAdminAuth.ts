import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function useAdminAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profileData, isLoading: roleLoading } = useQuery({
    queryKey: ["admin-role", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("role, is_super_admin")
        .eq("id", userId!)
        .maybeSingle();

      if (error || !data) return { isAdmin: false, isSuperAdmin: false };
      return {
        isAdmin: data.role === "admin" || data.is_super_admin === true,
        isSuperAdmin: data.is_super_admin === true,
      };
    },
    enabled: !!userId,
  });

  return {
    isAdmin: profileData?.isAdmin ?? false,
    isSuperAdmin: profileData?.isSuperAdmin ?? false,
    isLoading: authLoading || (!!userId && roleLoading),
  };
}

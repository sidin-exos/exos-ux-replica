import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireSuperAdmin = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setAuthenticated(true);

      if (requireAdmin || requireSuperAdmin) {
        const { data: roleData } = await supabase.rpc("is_super_admin", { _user_id: session.user.id });
        const { data: orgRole } = await supabase.rpc("get_user_org_role", { _user_id: session.user.id });

        const superAdmin = roleData === true;
        setIsSuperAdmin(superAdmin);
        setIsAdmin(orgRole === "admin" || superAdmin);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [requireAdmin, requireSuperAdmin]);

  if (loading) return null;
  if (!authenticated) return <Navigate to="/auth" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

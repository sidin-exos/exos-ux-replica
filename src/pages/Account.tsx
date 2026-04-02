import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShareableMode } from "@/hooks/useShareableMode";
import { ModelConfigPanel } from "@/components/settings/ModelConfigPanel";
import UserFilesManager from "@/components/files/UserFilesManager";
import ProfileCard from "@/components/account/ProfileCard";
import PlanUsageCard from "@/components/account/PlanUsageCard";
import UpgradePlansCard from "@/components/account/UpgradePlansCard";
import BillingHistoryCard from "@/components/account/BillingHistoryCard";
import { useAccountData } from "@/hooks/useAccountData";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Account = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { showTechnicalDetails } = useShareableMode();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { profile, usage, emptyFieldCount, updateProfile, isLoading: profileLoading } = useAccountData();

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast({ title: "Account confirmed!", description: "Your email has been verified. Welcome to EXOS!" });
      searchParams.delete("confirmed");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch {
      toast({ title: "Sign out failed", description: "An error occurred while signing out", variant: "destructive" });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen gradient-hero">
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
      <Header />

      <main className="container py-8 relative">
        <div className="max-w-[860px] mx-auto space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Account</h1>
              {lastSignIn && (
                <p className="text-sm text-muted-foreground mt-1">Last sign-in: {lastSignIn}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut} className="gap-2">
              {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Sign Out
            </Button>
          </div>

          {/* Profile */}
          {profileLoading || !profile ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <div className="animate-fade-up">
              <ProfileCard
                profile={profile}
                email={user?.email ?? ""}
                emptyFieldCount={emptyFieldCount}
                updateProfile={updateProfile}
              />
            </div>
          )}

          {/* Plan & Usage */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <PlanUsageCard usage={usage} />
          </div>

          {/* File Management */}
          <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
            <UserFilesManager />
          </div>

          {/* AI Model Configuration Panel (internal users only) */}
          {showTechnicalDetails && <ModelConfigPanel />}

          <Separator className="my-4" />

          {/* Upgrade Plans */}
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <UpgradePlansCard />
          </div>

          {/* Billing History */}
          <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
            <BillingHistoryCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Account;

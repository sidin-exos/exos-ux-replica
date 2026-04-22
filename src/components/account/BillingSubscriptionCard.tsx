import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

interface BillingSubscriptionCardProps {
  status?: SubscriptionStatus;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  planName?: string | null;
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  none: "No subscription",
};

const STATUS_VARIANTS: Record<
  SubscriptionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  trialing: "secondary",
  active: "default",
  past_due: "destructive",
  canceled: "outline",
  incomplete: "destructive",
  none: "outline",
};

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

const BillingSubscriptionCard = ({
  status = "trialing",
  trialEndsAt,
  currentPeriodEnd,
  planName = "Professional",
}: BillingSubscriptionCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {});
      if (error) throw error;
      if (!data?.url) throw new Error("No portal URL returned");
      window.location.href = data.url;
    } catch (err) {
      console.error("[portal] failed", err);
      toast({
        title: "Could not open billing portal",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const trialDate = formatDate(trialEndsAt);
  const periodDate = formatDate(currentPeriodEnd);

  return (
    <div id="section-billing-subscription" className="bg-card border border-border p-6 lg:p-8 rounded-lg">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Billing & Subscription
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your plan, payment method, and invoices.
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-border rounded-md p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Plan
          </p>
          <p className="text-base font-medium text-foreground">{planName ?? "—"}</p>
        </div>
        <div className="border border-border rounded-md p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {status === "trialing" ? "Trial ends" : "Renews"}
          </p>
          <p className="text-base font-medium text-foreground">
            {status === "trialing" ? trialDate ?? "—" : periodDate ?? "—"}
          </p>
        </div>
      </div>

      <Button
        onClick={handleManageBilling}
        disabled={loading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Opening portal…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Billing
          </>
        )}
      </Button>
    </div>
  );
};

export default BillingSubscriptionCard;

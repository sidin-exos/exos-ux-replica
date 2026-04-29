import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CreditCard, Sparkles } from "lucide-react";
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
  hasStripeCustomer?: boolean;
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  none: "Free Plan",
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

const trialDaysLeft = (iso?: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const BillingSubscriptionCard = ({
  status = "none",
  trialEndsAt,
  currentPeriodEnd,
  planName = null,
  hasStripeCustomer = false,
}: BillingSubscriptionCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const daysLeft = trialDaysLeft(trialEndsAt);

  const secondaryLabel =
    status === "trialing"
      ? "Trial ends"
      : status === "canceled"
        ? "Access until"
        : status === "past_due"
          ? "Payment due"
          : "Renews";

  const secondaryValue =
    status === "trialing"
      ? trialDate ?? "—"
      : status === "canceled"
        ? periodDate ?? "—"
        : periodDate ?? "—";

  const showSecondary = status !== "none";

  const renderCta = () => {
    if (status === "none") {
      return (
        <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade Plan
        </Button>
      );
    }

    if (status === "canceled" && !hasStripeCustomer) {
      return (
        <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          Resubscribe
        </Button>
      );
    }

    const ctaLabel =
      status === "canceled"
        ? "Resubscribe"
        : status === "past_due"
          ? "Update Payment Method"
          : "Manage Billing";

    return (
      <Button
        onClick={handleManageBilling}
        disabled={loading}
        variant={status === "past_due" ? "default" : "outline"}
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
            {ctaLabel}
          </>
        )}
      </Button>
    );
  };

  return (
    <div id="section-billing-subscription" className="bg-card border border-border p-6 lg:p-8 rounded-lg">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Billing & Subscription
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {status === "none"
              ? "Upgrade to unlock the full EXOS platform."
              : "Manage your plan, payment method, and invoices."}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[status]}>
          {status === "trialing" && daysLeft !== null
            ? `Trial · ${daysLeft}d left`
            : STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className={`grid grid-cols-1 ${showSecondary ? "sm:grid-cols-2" : ""} gap-4 mb-6`}>
        <div className="border border-border rounded-md p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Plan</p>
          <p className="text-base font-medium text-foreground">{planName ?? "Free Plan"}</p>
        </div>
        {showSecondary && (
          <div className="border border-border rounded-md p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {secondaryLabel}
            </p>
            <p className="text-base font-medium text-foreground">{secondaryValue}</p>
          </div>
        )}
      </div>

      {renderCta()}
    </div>
  );
};

export default BillingSubscriptionCard;

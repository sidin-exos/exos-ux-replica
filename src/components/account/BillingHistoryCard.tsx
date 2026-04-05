import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const BillingHistoryCard = () => {
  return (
    <Card className="card-elevated overflow-hidden">
      <div className="h-1" style={{ background: "hsl(var(--copper))" }} />
      <CardHeader>
        <CardTitle className="font-display text-lg">Billing History</CardTitle>
        <CardDescription>View your past invoices and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No billing history yet</p>
          <p className="text-sm mt-1">
            Your invoices will appear here after you{" "}
            <button
              className="text-primary hover:underline"
              onClick={() =>
                document.getElementById("upgrade-plans")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              subscribe to a plan ↓
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingHistoryCard;

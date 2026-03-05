import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";

interface TrackerListProps {
  trackers: EnterpriseTracker[];
  isLoading: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  setup: "secondary",
  paused: "outline",
};

const TrackerList = ({ trackers, isLoading }: TrackerListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-5 w-32 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-4 w-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (trackers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No trackers yet. Create one from the "Setup New Tracker" tab.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trackers.map((t) => (
        <Card key={t.id}>
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <CardTitle className="text-base leading-snug">{t.name}</CardTitle>
            <Badge variant={statusVariant[t.status] ?? "secondary"} className="shrink-0 capitalize">
              {t.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Created {format(new Date(t.created_at), "MMM d, yyyy")}
            </span>
            <Button variant="ghost" size="sm" className="gap-1.5" disabled>
              <Eye className="w-4 h-4" /> View
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrackerList;

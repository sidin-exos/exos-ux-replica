import { format } from "date-fns";
import { Eye, FolderPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
          <Card key={i}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (trackers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderPlus className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No trackers yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first enterprise tracker from the "Setup New Tracker" tab to start monitoring.
        </p>
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

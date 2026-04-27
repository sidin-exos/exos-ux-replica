import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarClock, Trash2, Inbox } from "lucide-react";
import { useSavedIntelConfigs } from "@/hooks/useSavedIntelConfigs";

interface ScheduledReportsListProps {
  /** Optional title override; defaults to "Your Scheduled Reports". */
  title?: string;
  /** Visual variant: full Card (default) or borderless inline block. */
  variant?: "card" | "inline";
}

/**
 * Compact list of the user's scheduled intelligence reports.
 * Reused both in the Scheduled Reports tab and as a sidebar widget
 * under Recent Queries on the Ad-hoc tab.
 */
export function ScheduledReportsList({
  title = "Your Scheduled Reports",
  variant = "card",
}: ScheduledReportsListProps) {
  const { configs, isLoading, loadConfigs, deleteConfig, toggleActive } = useSavedIntelConfigs();

  useEffect(() => {
    loadConfigs("scheduled");
  }, [loadConfigs]);

  const body = (
    <div className="space-y-3">
      {isLoading && configs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Inbox className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground max-w-[220px]">
            No scheduled reports yet. Create one from the Scheduled Reports tab.
          </p>
        </div>
      ) : (
        configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{config.name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {config.schedule_cron}
                </Badge>
                {!config.is_active && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {config.query_text}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => toggleActive(config.id, checked)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteConfig(config.id)}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold">
            {title} {configs.length > 0 && `(${configs.length})`}
          </h3>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className="border-t-4 border-t-warning">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-warning" />
          {title} {configs.length > 0 && `(${configs.length})`}
        </CardTitle>
        <CardDescription>Recurring intelligence runs</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

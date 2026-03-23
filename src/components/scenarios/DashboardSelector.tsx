import { useState, useEffect } from "react";
import {
  CheckCircle2,
  LayoutGrid,
  TrendingDown,
  Calendar,
  Grid3X3,
  TrendingUp,
  Users,
  Activity,
  Shield,
  GitCompare,
  Award,
  FileText,
  Handshake,
  Database,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DashboardType,
  dashboardConfigs,
  getDashboardsForScenario,
} from "@/lib/dashboard-mappings";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle2,
  LayoutGrid,
  TrendingDown,
  Calendar,
  Grid3X3,
  TrendingUp,
  Users,
  Activity,
  Shield,
  GitCompare,
  Award,
  FileText,
  Handshake,
  Database,
};

interface DashboardSelectorProps {
  scenarioId: string;
  selectedDashboards: DashboardType[];
  onSelectionChange: (dashboards: DashboardType[]) => void;
}

const DashboardSelector = ({
  scenarioId,
  selectedDashboards,
  onSelectionChange,
}: DashboardSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableDashboards = getDashboardsForScenario(scenarioId);

  // Initialize with recommended dashboards if none selected
  useEffect(() => {
    if (selectedDashboards.length === 0 && availableDashboards.length > 0) {
      // Select first 2 dashboards by default
      onSelectionChange(availableDashboards.slice(0, 2));
    }
  }, [scenarioId, availableDashboards]);

  const handleToggle = (dashboardId: DashboardType) => {
    if (selectedDashboards.includes(dashboardId)) {
      onSelectionChange(selectedDashboards.filter((d) => d !== dashboardId));
    } else {
      onSelectionChange([...selectedDashboards, dashboardId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(availableDashboards);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto rounded-none hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Report Dashboards</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDashboards.length} of {availableDashboards.length} selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedDashboards.length > 0 && (
                <div className="flex gap-1">
                  {selectedDashboards.slice(0, 3).map((id) => {
                    const config = dashboardConfigs[id];
                    const IconComponent = iconMap[config?.icon] || LayoutGrid;
                    return (
                      <div
                        key={id}
                        className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center"
                      >
                        <IconComponent className="w-3 h-3 text-primary" />
                      </div>
                    );
                  })}
                  {selectedDashboards.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedDashboards.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4">
            {/* Quick actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Choose which dashboards to include in your report
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-7"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Dashboard options */}
            <div className="grid grid-cols-1 gap-2">
              {availableDashboards.map((dashboardId, index) => {
                const config = dashboardConfigs[dashboardId];
                if (!config) return null;

                const IconComponent = iconMap[config.icon] || LayoutGrid;
                const isSelected = selectedDashboards.includes(dashboardId);
                const isRecommended = index < 2; // First 2 are recommended

                return (
                  <div
                    key={dashboardId}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40"
                        : "bg-secondary/20 border-border hover:border-primary/30"
                    }`}
                    onClick={() => handleToggle(dashboardId)}
                  >
                    <Checkbox
                      id={dashboardId}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(dashboardId)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                        <Label
                          htmlFor={dashboardId}
                          className="font-medium text-foreground cursor-pointer"
                        >
                          {config.name}
                        </Label>
                        {isRecommended && (
                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableDashboards.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No dashboards available for this scenario type.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DashboardSelector;

import { Badge } from "@/components/ui/badge";
import { DashboardConfig, DashboardType } from "@/lib/dashboard-mappings";
import { getDashboardScenarioInfo, getDashboardScenarioCount } from "@/lib/dashboard-scenario-mapping";
import { useState } from "react";
import { ChevronDown, ChevronUp, BarChart3, HelpCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/scenarios";

interface DashboardContextCardProps {
  dashboardId: DashboardType;
  config: DashboardConfig;
}

const CATEGORY_CHIP: Record<Scenario["category"], { iconBg: string; iconText: string; accent: string }> = {
  analysis: {
    iconBg: "bg-copper/15",
    iconText: "text-copper",
    accent: "hover:border-copper/30",
  },
  planning: {
    iconBg: "bg-iris/15",
    iconText: "text-iris",
    accent: "hover:border-iris/30",
  },
  risk: {
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    accent: "hover:border-destructive/30",
  },
  documentation: {
    iconBg: "bg-info/15",
    iconText: "text-info",
    accent: "hover:border-info/30",
  },
};

const DashboardContextCard = ({ dashboardId, config }: DashboardContextCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scenarioInfo = getDashboardScenarioInfo(dashboardId);
  const scenarioCount = getDashboardScenarioCount(dashboardId);

  return (
    <div className="mb-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm dark:bg-card/60 dark:border-white/10 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {config.name}
          </h3>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {scenarioCount} scenario{scenarioCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs hidden sm:inline">
            {isExpanded ? "Collapse" : "Expand"} guide
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 animate-fade-up">
          {/* When to use */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.whenToUse}
          </p>

          {/* Two-column: Metrics + Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80 uppercase tracking-wide">
                <BarChart3 className="h-3.5 w-3.5 text-primary/70" />
                Key Metrics
              </div>
              <ul className="space-y-1.5">
                {config.keyMetrics.map((metric, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions Answered */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80 uppercase tracking-wide">
                <HelpCircle className="h-3.5 w-3.5 text-primary/70" />
                Questions This Answers
              </div>
              <ul className="space-y-1.5">
                {config.questionsAnswered.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scenarios */}
          {scenarioInfo.length > 0 && (
            <div className="pt-4 border-t border-border/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                <Layers className="h-4 w-4 text-primary" />
                Available for Scenarios
              </div>
              <div className="flex flex-wrap gap-2">
                {scenarioInfo.map(({ id, title, icon: Icon, category }) => {
                  const c = CATEGORY_CHIP[category];
                  return (
                    <div
                      key={id}
                      className={cn(
                        "group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border/50 bg-gradient-to-b from-card to-card/50 shadow-sm ring-1 ring-border/30 transition-all duration-200",
                        "hover:-translate-y-0.5 hover:from-card hover:to-muted/40 hover:shadow-md hover:border-primary/40",
                        c.accent
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                          c.iconBg
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", c.iconText)} />
                      </span>
                      <span className="text-sm font-medium text-foreground leading-none">
                        {title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardContextCard;

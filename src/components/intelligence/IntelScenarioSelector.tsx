import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntelScenario = "adhoc" | "regular";

interface ScenarioOption {
  id: IntelScenario;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
}

const SCENARIO_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  adhoc: {
    bg: "bg-cyan-500/10 dark:bg-cyan-400/10",
    border: "border-cyan-500 dark:border-cyan-400",
    text: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500 text-white",
  },
  regular: {
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
    border: "border-amber-500 dark:border-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500 text-white",
  },
};

const scenarios: ScenarioOption[] = [
  {
    id: "adhoc",
    title: "Ad-hoc Query",
    description: "Run a one-time intelligence query with real-time web search and AI analysis",
    icon: Search,
  },
  {
    id: "regular",
    title: "Scheduled Reports",
    description: "Configure recurring intelligence queries — daily, weekly, or monthly briefings saved to your knowledge base",
    icon: CalendarClock,
  },
];

interface IntelScenarioSelectorProps {
  selected: IntelScenario;
  onSelect: (scenario: IntelScenario) => void;
}

export function IntelScenarioSelector({ selected, onSelect }: IntelScenarioSelectorProps) {
  return (
    <Card className="glass-effect mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Intelligence Mode</CardTitle>
        <CardDescription>
          Choose how you want to receive market intelligence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            const isSelected = selected === scenario.id;
            const isDisabled = scenario.badge === "Coming Soon";
            const colors = SCENARIO_COLORS[scenario.id];

            return (
              <button
                key={scenario.id}
                onClick={() => !isDisabled && onSelect(scenario.id)}
                disabled={isDisabled}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all duration-300 group",
                  "bg-card shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)]",
                  "hover:-translate-y-0.5",
                  "active:translate-y-0",
                  isSelected && !isDisabled
                    ? cn(colors?.bg, colors?.border, "ring-1 ring-offset-1", `ring-current shadow-lg`)
                    : "border-border/60 hover:border-muted-foreground/40",
                  isDisabled && "opacity-60 cursor-not-allowed hover:border-border hover:bg-transparent hover:translate-y-0 hover:shadow-none"
                )}
              >
                {scenario.badge && (
                  <Badge
                    variant={scenario.badgeVariant}
                    className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5"
                  >
                    {scenario.badge}
                  </Badge>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    isSelected && !isDisabled ? colors?.iconBg : "bg-muted"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn("font-medium text-sm", isSelected && !isDisabled && colors?.text)}>{scenario.title}</h4>
                      {isSelected && !isDisabled && (
                        <ArrowRight className={cn("w-3 h-3", colors?.text)} />
                      )}
                    </div>
                    <p className="text-xs text-foreground/70 line-clamp-2">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

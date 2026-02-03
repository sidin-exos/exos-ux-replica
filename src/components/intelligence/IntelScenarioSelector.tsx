import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Bell, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntelScenario = "adhoc" | "regular" | "triggered";

interface ScenarioOption {
  id: IntelScenario;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
}

const scenarios: ScenarioOption[] = [
  {
    id: "adhoc",
    title: "Ad-hoc Query",
    description: "Run a one-time intelligence query with real-time web search and AI analysis",
    icon: Search,
  },
  {
    id: "regular",
    title: "Regular Reports",
    description: "Set up scheduled updates with your inputs — daily, weekly, or monthly intelligence briefings",
    icon: CalendarClock,
    badge: "Coming Soon",
    badgeVariant: "secondary",
  },
  {
    id: "triggered",
    title: "Triggered Notifications",
    description: "Monitor conditions continuously and get notified when selected triggers are confirmed",
    icon: Bell,
    badge: "Coming Soon",
    badgeVariant: "secondary",
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
        <div className="grid md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            const isSelected = selected === scenario.id;
            const isDisabled = scenario.badge === "Coming Soon";

            return (
              <button
                key={scenario.id}
                onClick={() => !isDisabled && onSelect(scenario.id)}
                disabled={isDisabled}
                className={cn(
                  "relative p-4 rounded-lg border text-left transition-all group",
                  isSelected && !isDisabled
                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30",
                  isDisabled && "opacity-60 cursor-not-allowed hover:border-border hover:bg-transparent"
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
                    isSelected && !isDisabled ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{scenario.title}</h4>
                      {isSelected && !isDisabled && (
                        <ArrowRight className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
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

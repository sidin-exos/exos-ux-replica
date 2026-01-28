import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Building2, Plus, X, Shield, Target } from "lucide-react";
import { useIndustryContext } from "@/hooks/useContextData";
import type { IndustryContext } from "@/lib/ai-context-templates";

export interface IndustryContextOverrides {
  enabledConstraints: Record<string, boolean>;
  enabledKpis: Record<string, boolean>;
  customConstraints: string[];
  customKpis: string[];
}

interface IndustryContextEditorProps {
  industrySlug: string | null;
  overrides: IndustryContextOverrides;
  onOverridesChange: (overrides: IndustryContextOverrides) => void;
}

export function getDefaultOverrides(): IndustryContextOverrides {
  return {
    enabledConstraints: {},
    enabledKpis: {},
    customConstraints: [],
    customKpis: [],
  };
}

export function applyOverridesToIndustry(
  industry: IndustryContext,
  overrides: IndustryContextOverrides
): IndustryContext {
  const filteredConstraints = industry.constraints.filter((c, i) => {
    const key = `${i}-${c.slice(0, 20)}`;
    return overrides.enabledConstraints[key] !== false;
  });

  const filteredKpis = industry.kpis.filter((k, i) => {
    const key = `${i}-${k.slice(0, 20)}`;
    return overrides.enabledKpis[key] !== false;
  });

  return {
    ...industry,
    constraints: [...filteredConstraints, ...overrides.customConstraints],
    kpis: [...filteredKpis, ...overrides.customKpis],
  };
}

export function IndustryContextEditor({
  industrySlug,
  overrides,
  onOverridesChange,
}: IndustryContextEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newConstraint, setNewConstraint] = useState("");
  const [newKpi, setNewKpi] = useState("");
  
  const { data: industry } = useIndustryContext(industrySlug);

  // Initialize all constraints/KPIs as enabled when industry changes
  useEffect(() => {
    if (industry) {
      const newEnabledConstraints: Record<string, boolean> = {};
      const newEnabledKpis: Record<string, boolean> = {};
      
      industry.constraints.forEach((c, i) => {
        const key = `${i}-${c.slice(0, 20)}`;
        if (overrides.enabledConstraints[key] === undefined) {
          newEnabledConstraints[key] = true;
        }
      });
      
      industry.kpis.forEach((k, i) => {
        const key = `${i}-${k.slice(0, 20)}`;
        if (overrides.enabledKpis[key] === undefined) {
          newEnabledKpis[key] = true;
        }
      });
      
      if (Object.keys(newEnabledConstraints).length > 0 || Object.keys(newEnabledKpis).length > 0) {
        onOverridesChange({
          ...overrides,
          enabledConstraints: { ...overrides.enabledConstraints, ...newEnabledConstraints },
          enabledKpis: { ...overrides.enabledKpis, ...newEnabledKpis },
        });
      }
    }
  }, [industry?.id]);

  if (!industry) {
    return null;
  }

  const toggleConstraint = (key: string) => {
    onOverridesChange({
      ...overrides,
      enabledConstraints: {
        ...overrides.enabledConstraints,
        [key]: !overrides.enabledConstraints[key],
      },
    });
  };

  const toggleKpi = (key: string) => {
    onOverridesChange({
      ...overrides,
      enabledKpis: {
        ...overrides.enabledKpis,
        [key]: !overrides.enabledKpis[key],
      },
    });
  };

  const addCustomConstraint = () => {
    if (newConstraint.trim()) {
      onOverridesChange({
        ...overrides,
        customConstraints: [...overrides.customConstraints, newConstraint.trim()],
      });
      setNewConstraint("");
    }
  };

  const addCustomKpi = () => {
    if (newKpi.trim()) {
      onOverridesChange({
        ...overrides,
        customKpis: [...overrides.customKpis, newKpi.trim()],
      });
      setNewKpi("");
    }
  };

  const removeCustomConstraint = (index: number) => {
    onOverridesChange({
      ...overrides,
      customConstraints: overrides.customConstraints.filter((_, i) => i !== index),
    });
  };

  const removeCustomKpi = (index: number) => {
    onOverridesChange({
      ...overrides,
      customKpis: overrides.customKpis.filter((_, i) => i !== index),
    });
  };

  const activeConstraints = industry.constraints.filter((c, i) => {
    const key = `${i}-${c.slice(0, 20)}`;
    return overrides.enabledConstraints[key] !== false;
  }).length + overrides.customConstraints.length;

  const activeKpis = industry.kpis.filter((k, i) => {
    const key = `${i}-${k.slice(0, 20)}`;
    return overrides.enabledKpis[key] !== false;
  }).length + overrides.customKpis.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-primary/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Fine-tune: {industry.name}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {activeConstraints} constraints
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeKpis} KPIs
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Regulatory Constraints Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <Label className="font-medium">Regulatory Constraints</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Toggle constraints that apply to your specific situation
              </p>
              
              <div className="space-y-2">
                {industry.constraints.map((constraint, i) => {
                  const key = `${i}-${constraint.slice(0, 20)}`;
                  const isEnabled = overrides.enabledConstraints[key] !== false;
                  
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-2 rounded-md transition-colors ${
                        isEnabled ? "bg-background" : "bg-muted/50 opacity-60"
                      }`}
                    >
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleConstraint(key)}
                        className="mt-0.5"
                      />
                      <span className="text-sm flex-1">{constraint}</span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Constraints */}
              {overrides.customConstraints.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Your custom constraints</p>
                  {overrides.customConstraints.map((constraint, i) => (
                    <div
                      key={`custom-${i}`}
                      className="flex items-start gap-3 p-2 rounded-md bg-primary/10"
                    >
                      <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
                      <span className="text-sm flex-1">{constraint}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeCustomConstraint(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Constraint */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom constraint..."
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomConstraint()}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addCustomConstraint}
                  disabled={!newConstraint.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Performance KPIs Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <Label className="font-medium">Performance KPIs</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the KPIs relevant to your analysis
              </p>
              
              <div className="space-y-2">
                {industry.kpis.map((kpi, i) => {
                  const key = `${i}-${kpi.slice(0, 20)}`;
                  const isEnabled = overrides.enabledKpis[key] !== false;
                  
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-2 rounded-md transition-colors ${
                        isEnabled ? "bg-background" : "bg-muted/50 opacity-60"
                      }`}
                    >
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleKpi(key)}
                        className="mt-0.5"
                      />
                      <span className="text-sm flex-1">{kpi}</span>
                    </div>
                  );
                })}
              </div>

              {/* Custom KPIs */}
              {overrides.customKpis.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Your custom KPIs</p>
                  {overrides.customKpis.map((kpi, i) => (
                    <div
                      key={`custom-kpi-${i}`}
                      className="flex items-start gap-3 p-2 rounded-md bg-primary/10"
                    >
                      <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
                      <span className="text-sm flex-1">{kpi}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeCustomKpi(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom KPI */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom KPI..."
                  value={newKpi}
                  onChange={(e) => setNewKpi(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomKpi()}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addCustomKpi}
                  disabled={!newKpi.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

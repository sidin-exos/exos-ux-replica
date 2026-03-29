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
import { ChevronDown, ChevronUp, Building2, Plus, X, Shield, Target, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useIndustryContext } from "@/hooks/useContextData";
import type { IndustryContext, ConstraintV2, KpiV2 } from "@/lib/ai-context-templates";

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

function DirectionIcon({ direction }: { direction?: string }) {
  if (!direction) return null;
  const d = direction.toLowerCase();
  if (d.includes('min') || d.includes('decrease') || d.includes('lower') || d.includes('↓')) {
    return <TrendingDown className="h-3 w-3 text-green-500 shrink-0" />;
  }
  if (d.includes('max') || d.includes('increase') || d.includes('higher') || d.includes('↑')) {
    return <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground shrink-0" />;
}

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    T1: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    T2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    T3: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors[tier] || colors.T3}`}>
      {tier}
    </span>
  );
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

  const hasV2Constraints = industry?.constraints_v2 && industry.constraints_v2.length > 0;
  const hasV2Kpis = industry?.kpis_v2 && industry.kpis_v2.length > 0;

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

  const blockerCount = hasV2Constraints
    ? industry.constraints_v2!.filter((c, i) => {
        const legacyText = industry.constraints[i] || c.label;
        const key = `${i}-${legacyText.slice(0, 20)}`;
        return c.blocker && overrides.enabledConstraints[key] !== false;
      }).length
    : 0;

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
                {blockerCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {blockerCount} Blocker{blockerCount > 1 ? 's' : ''}
                  </Badge>
                )}
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
                {hasV2Constraints ? (
                  industry.constraints_v2!.map((cv2, i) => {
                    // Use legacy constraint text for the key to maintain compat
                    const legacyText = industry.constraints[i] || cv2.label;
                    const key = `${i}-${legacyText.slice(0, 20)}`;
                    const isEnabled = overrides.enabledConstraints[key] !== false;
                    
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-3 p-2 rounded-md transition-colors ${
                          isEnabled ? "bg-background" : "bg-muted/50 opacity-60"
                        } ${cv2.blocker ? "ring-1 ring-destructive/30" : ""}`}
                      >
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleConstraint(key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TierBadge tier={cv2.tier} />
                            {cv2.blocker && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                Blocker
                              </span>
                            )}
                            <span className="text-sm">{cv2.label}</span>
                          </div>
                          {cv2.eu_ref && (
                            <p className="text-[11px] text-muted-foreground">EU Ref: {cv2.eu_ref}</p>
                          )}
                          {cv2.procurement_impact && (
                            <p className="text-[11px] text-muted-foreground">Impact: {cv2.procurement_impact}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  industry.constraints.map((constraint, i) => {
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
                  })
                )}
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
                {hasV2Kpis ? (
                  industry.kpis_v2!.map((kv2, i) => {
                    const legacyText = industry.kpis[i] || kv2.label;
                    const key = `${i}-${legacyText.slice(0, 20)}`;
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
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <DirectionIcon direction={kv2.direction} />
                          <span className="text-sm">{kv2.label}</span>
                          {kv2.exos_lever && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {kv2.exos_lever}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  industry.kpis.map((kpi, i) => {
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
                  })
                )}
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

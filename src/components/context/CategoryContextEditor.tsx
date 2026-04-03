import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FolderKanban, Plus, X, FileText, Target, Scale, AlertCircle, TrendingUp, TrendingDown, Minus, Gavel, ShieldAlert } from "lucide-react";
import { useProcurementCategory } from "@/hooks/useContextData";
import type { ProcurementCategory, KpiV2 } from "@/lib/ai-context-templates";

export interface CategoryContextOverrides {
  characteristicsOverride: string | null;
  enabledKpis: Record<string, boolean>;
  customKpis: string[];
  additionalNotes: string;
}

interface CategoryContextEditorProps {
  categorySlug: string | null;
  overrides: CategoryContextOverrides;
  onOverridesChange: (overrides: CategoryContextOverrides) => void;
}

export function getDefaultCategoryOverrides(): CategoryContextOverrides {
  return {
    characteristicsOverride: null,
    enabledKpis: {},
    customKpis: [],
    additionalNotes: "",
  };
}

export function applyOverridesToCategory(
  category: ProcurementCategory,
  overrides: CategoryContextOverrides
): ProcurementCategory {
  const filteredKpis = category.kpis.filter((k, i) => {
    const key = `${i}-${k.slice(0, 20)}`;
    return overrides.enabledKpis[key] !== false;
  });

  return {
    ...category,
    characteristics: overrides.characteristicsOverride || category.characteristics,
    kpis: [...filteredKpis, ...overrides.customKpis],
  };
}

function DirectionIcon({ direction }: { direction?: string }) {
  if (!direction) return null;
  const d = direction.toLowerCase();
  if (d.includes('min') || d.includes('decrease') || d.includes('lower') || d.includes('↓')) {
    return <TrendingDown className="h-3 w-3 text-success shrink-0" />;
  }
  if (d.includes('max') || d.includes('increase') || d.includes('higher') || d.includes('↑')) {
    return <TrendingUp className="h-3 w-3 text-info shrink-0" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground shrink-0" />;
}

const KRALJIC_COLORS: Record<string, string> = {
  "Strategic": "bg-destructive/15 text-destructive",
  "Leverage": "bg-warning/15 text-warning",
  "Bottleneck": "bg-iris/15 text-iris",
  "Non-Critical": "bg-success/15 text-success",
  "Routine": "bg-success/15 text-success",
};

export function CategoryContextEditor({
  categorySlug,
  overrides,
  onOverridesChange,
}: CategoryContextEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKpi, setNewKpi] = useState("");
  const [isEditingCharacteristics, setIsEditingCharacteristics] = useState(false);
  
  const { data: category } = useProcurementCategory(categorySlug);

  const hasV2Kpis = category?.kpis_v2 && category.kpis_v2.length > 0;
  const hasEnrichedData = !!(category?.kraljic_position || category?.key_cost_drivers?.length || category?.procurement_levers?.length || category?.eu_regulatory_context);

  // Initialize all KPIs as enabled when category changes
  useEffect(() => {
    if (category) {
      const newEnabledKpis: Record<string, boolean> = {};
      
      category.kpis.forEach((k, i) => {
        const key = `${i}-${k.slice(0, 20)}`;
        if (overrides.enabledKpis[key] === undefined) {
          newEnabledKpis[key] = true;
        }
      });
      
      if (Object.keys(newEnabledKpis).length > 0) {
        onOverridesChange({
          ...overrides,
          enabledKpis: { ...overrides.enabledKpis, ...newEnabledKpis },
        });
      }
    }
  }, [category?.id]);

  if (!category) {
    return null;
  }

  const toggleKpi = (key: string) => {
    onOverridesChange({
      ...overrides,
      enabledKpis: {
        ...overrides.enabledKpis,
        [key]: !overrides.enabledKpis[key],
      },
    });
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

  const removeCustomKpi = (index: number) => {
    onOverridesChange({
      ...overrides,
      customKpis: overrides.customKpis.filter((_, i) => i !== index),
    });
  };

  const updateCharacteristics = (value: string) => {
    onOverridesChange({
      ...overrides,
      characteristicsOverride: value || null,
    });
  };

  const resetCharacteristics = () => {
    onOverridesChange({
      ...overrides,
      characteristicsOverride: null,
    });
    setIsEditingCharacteristics(false);
  };

  const updateAdditionalNotes = (value: string) => {
    onOverridesChange({
      ...overrides,
      additionalNotes: value,
    });
  };

  const activeKpis = category.kpis.filter((k, i) => {
    const key = `${i}-${k.slice(0, 20)}`;
    return overrides.enabledKpis[key] !== false;
  }).length + overrides.customKpis.length;

  const currentCharacteristics = overrides.characteristicsOverride || category.characteristics;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-accent/20 bg-accent/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-accent-foreground" />
                AI Settings: {category.name}
              </span>
              <div className="flex items-center gap-2">
                {category.kraljic_position && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${KRALJIC_COLORS[category.kraljic_position] || "bg-muted text-muted-foreground"}`}>
                    {category.kraljic_position}
                  </span>
                )}
                {overrides.characteristicsOverride && (
                  <Badge variant="secondary" className="text-xs">
                    Modified
                  </Badge>
                )}
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
            {/* Enriched Market Profile (read-only) */}
            {hasEnrichedData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-iris" />
                  <Label className="font-medium">Market Profile</Label>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {category.kraljic_position && (
                    <div className="p-2 rounded-md bg-background">
                      <span className="text-muted-foreground">Kraljic Position</span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${KRALJIC_COLORS[category.kraljic_position] || "bg-muted text-muted-foreground"}`}>
                          {category.kraljic_position}
                        </span>
                      </div>
                      {category.kraljic_rationale && (
                        <p className="text-muted-foreground mt-1">{category.kraljic_rationale}</p>
                      )}
                    </div>
                  )}
                  {category.price_volatility && (
                    <div className="p-2 rounded-md bg-background">
                      <span className="text-muted-foreground">Price Volatility</span>
                      <p className="mt-1 font-medium">{category.price_volatility}</p>
                    </div>
                  )}
                  {category.market_structure && (
                    <div className="p-2 rounded-md bg-background">
                      <span className="text-muted-foreground">Market Structure</span>
                      <p className="mt-1 font-medium">{category.market_structure}</p>
                    </div>
                  )}
                  {category.supply_concentration && (
                    <div className="p-2 rounded-md bg-background">
                      <span className="text-muted-foreground">Supply Concentration</span>
                      <p className="mt-1 font-medium">{category.supply_concentration}</p>
                    </div>
                  )}
                </div>

                {/* Key Cost Drivers */}
                {category.key_cost_drivers && category.key_cost_drivers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Key Cost Drivers</p>
                    <div className="flex flex-wrap gap-1">
                      {category.key_cost_drivers.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">
                          {d.driver}{d.share_pct ? ` (${d.share_pct})` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Procurement Levers */}
                {category.procurement_levers && category.procurement_levers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Gavel className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">Procurement Levers</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.procurement_levers.map((l, i) => (
                        <Badge key={i} variant="secondary" className="text-xs py-0">
                          {l.lever}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* EU Regulatory Context */}
                {category.eu_regulatory_context && (
                  <div className="p-2.5 rounded-md bg-info/10 border border-info/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-info" />
                      <span className="text-xs font-semibold text-info">EU Regulatory Context</span>
                    </div>
                    <p className="text-xs text-info/80">{category.eu_regulatory_context}</p>
                  </div>
                )}

                {/* Common Failure Modes */}
                {category.common_failure_modes && category.common_failure_modes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 text-copper" />
                      <p className="text-xs text-muted-foreground font-medium">Common Failure Modes</p>
                    </div>
                    <ul className="space-y-1">
                      {category.common_failure_modes.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-3">
                          • {f.mode}{f.mitigation ? ` → ${f.mitigation}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Category Characteristics Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-info" />
                  <Label className="font-medium">Category Characteristics</Label>
                </div>
                {!isEditingCharacteristics ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingCharacteristics(true)}
                  >
                    Customize
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetCharacteristics}
                  >
                    Reset to Default
                  </Button>
                )}
              </div>
              
              {isEditingCharacteristics ? (
                <Textarea
                  value={currentCharacteristics}
                  onChange={(e) => updateCharacteristics(e.target.value)}
                  placeholder="Describe the key characteristics of this procurement category..."
                  className="min-h-[100px] text-sm"
                />
              ) : (
                <div className="p-3 rounded-md bg-background text-sm">
                  {currentCharacteristics}
                </div>
              )}
              
              {overrides.characteristicsOverride && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">Customized</Badge>
                  Using your modified characteristics
                </p>
              )}
            </div>

            {/* Performance KPIs Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <Label className="font-medium">Category KPIs</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the performance indicators relevant to your analysis
              </p>
              
              <div className="space-y-2">
                {hasV2Kpis ? (
                  category.kpis_v2!.map((kv2, i) => {
                    const legacyText = category.kpis[i] || kv2.label;
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
                  category.kpis.map((kpi, i) => {
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
                      className="flex items-start gap-3 p-2 rounded-md bg-accent/10"
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

            {/* Additional Notes Section */}
            <div className="space-y-3">
              <Label className="font-medium">Additional Context (Optional)</Label>
              <Textarea
                value={overrides.additionalNotes}
                onChange={(e) => updateAdditionalNotes(e.target.value)}
                placeholder="Add any specific context about your situation that should influence the analysis..."
                className="min-h-[80px] text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This context will be factored into the AI analysis
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

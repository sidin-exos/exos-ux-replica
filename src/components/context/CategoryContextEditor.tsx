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
import { ChevronDown, ChevronUp, FolderKanban, Plus, X, FileText, Target } from "lucide-react";
import { useProcurementCategory } from "@/hooks/useContextData";
import type { ProcurementCategory } from "@/lib/ai-context-templates";

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

export function CategoryContextEditor({
  categorySlug,
  overrides,
  onOverridesChange,
}: CategoryContextEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKpi, setNewKpi] = useState("");
  const [isEditingCharacteristics, setIsEditingCharacteristics] = useState(false);
  
  const { data: category } = useProcurementCategory(categorySlug);

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
                Fine-tune: {category.name}
              </span>
              <div className="flex items-center gap-2">
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
            {/* Category Characteristics Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
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
                <Target className="h-4 w-4 text-green-500" />
                <Label className="font-medium">Category KPIs</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the performance indicators relevant to your analysis
              </p>
              
              <div className="space-y-2">
                {category.kpis.map((kpi, i) => {
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

import { useState } from "react";
import { Zap, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { scenarios } from "@/lib/scenarios";
import { generateAITestData } from "@/lib/ai-test-data-generator";
import { useIndustryContexts, useProcurementCategories } from "@/hooks/useContextData";
import type { BuyerPersona, EntropyLevel } from "@/lib/testing/types";

const PERSONAS: { value: BuyerPersona; label: string; desc: string }[] = [
  { value: "rushed-junior", label: "Rushed Junior Buyer", desc: "Minimal context, informal language" },
  { value: "methodical-manager", label: "Methodical Category Manager", desc: "Highly detailed, structured input" },
  { value: "cfo-finance", label: "CFO / Finance Leader", desc: "Financial precision, high-level summaries" },
  { value: "frustrated-stakeholder", label: "Frustrated Stakeholder", desc: "Messy narratives, ad-hoc usage" },
];

const ENTROPY_LEVELS: { value: string; level: EntropyLevel; label: string; desc: string }[] = [
  { value: "1", level: 1, label: "L1 — Structured", desc: "80% structured data" },
  { value: "2", level: 2, label: "L2 — Mixed", desc: "50/50 structured & raw" },
  { value: "3", level: 3, label: "L3 — Raw Dump", desc: "90% unstructured input" },
];

const LaunchTestBatch = () => {
  const [scenarioId, setScenarioId] = useState("");
  const [persona, setPersona] = useState<BuyerPersona>("rushed-junior");
  const [entropy, setEntropy] = useState<string>("2");
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const availableScenarios = scenarios.filter((s) => s.status === "available");
  const { data: industries, isLoading: industriesLoading } = useIndustryContexts();
  const { data: categories, isLoading: categoriesLoading } = useProcurementCategories();

  const handleLaunch = async () => {
    if (!scenarioId) {
      toast({ title: "Select a scenario", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    const entropyLevel = Number(entropy) as EntropyLevel;

    try {
      const result = await generateAITestData({
        scenarioType: scenarioId,
        industry: industry || undefined,
        category: category || undefined,
        mctsIterations: entropyLevel === 3 ? 1 : 3,
      });

      if (result.success) {
        toast({
          title: "Test batch complete",
          description: `Score: ${result.metadata.score} | ${result.metadata.iterations} iterations`,
        });
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          Launch Test Batch
        </CardTitle>
        <CardDescription>
          Configure and trigger an AI-generated test case with entropy controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario */}
        <div className="space-y-2">
          <Label>Scenario Type</Label>
          <Select value={scenarioId} onValueChange={setScenarioId}>
            <SelectTrigger>
              <SelectValue placeholder="Select scenario…" />
            </SelectTrigger>
            <SelectContent>
              {availableScenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <Label>Buyer Persona</Label>
          <Select value={persona} onValueChange={(v) => setPersona(v as BuyerPersona)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONAS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span>{p.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {p.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entropy Level */}
        <div className="space-y-3">
          <Label>Entropy Level</Label>
          <RadioGroup value={entropy} onValueChange={setEntropy} className="flex gap-4">
            {ENTROPY_LEVELS.map((e) => (
              <div key={e.value} className="flex items-center gap-2">
                <RadioGroupItem value={e.value} id={`entropy-${e.value}`} />
                <Label htmlFor={`entropy-${e.value}`} className="cursor-pointer">
                  <span className="font-medium">{e.label}</span>
                  <span className="text-xs text-muted-foreground ml-1">({e.desc})</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Industry / Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Industry (optional)</Label>
            <Select value={industry} onValueChange={(v) => { setIndustry(v === "__none__" ? "" : v); }} disabled={industriesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={industriesLoading ? "Loading..." : "Any industry"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any industry</SelectItem>
                {industries?.map((i) => (
                  <SelectItem key={i.id} value={i.slug}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category (optional)</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v === "__none__" ? "" : v); }} disabled={categoriesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={categoriesLoading ? "Loading..." : "Any category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any category</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="hero"
          onClick={handleLaunch}
          disabled={isRunning || !scenarioId}
          className="w-full gap-2"
        >
          <Zap className="w-4 h-4" />
          {isRunning ? "Running…" : "Launch Test"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LaunchTestBatch;

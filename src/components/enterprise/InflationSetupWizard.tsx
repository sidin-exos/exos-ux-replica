import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Plus, Trash2, ArrowLeft, ArrowRight, Rocket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DriverInput } from "@/hooks/useInflationTrackers";

interface Props {
  onActivate: (data: { goods_definition: string; driver_count_target: number; drivers: DriverInput[] }) => Promise<unknown>;
  onComplete: () => void;
}

interface WizardDriver {
  name: string;
  rationale: string;
  accepted: boolean;
  source: "ai_proposed" | "user_defined";
  weight: number | null;
  trigger: string;
}

const InflationSetupWizard = ({ onActivate, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [goodsDefinition, setGoodsDefinition] = useState("");
  const [drivers, setDrivers] = useState<WizardDriver[]>([]);
  const [customName, setCustomName] = useState("");
  const [customRationale, setCustomRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const acceptedDrivers = drivers.filter(d => d.accepted);

  // Step 0 → 1: call Gemini to propose drivers
  const handleGoodsNext = async () => {
    if (!goodsDefinition.trim()) return;
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("im-driver-propose", {
        body: { goods_definition: goodsDefinition.trim(), driver_count_target: 5 },
      });

      if (error) throw error;

      const proposed = (data?.drivers ?? []) as Array<{ name: string; rationale: string }>;
      if (proposed.length === 0) throw new Error("No drivers returned");

      setDrivers(proposed.map(d => ({
        name: d.name,
        rationale: d.rationale,
        accepted: true,
        source: "ai_proposed" as const,
        weight: null,
        trigger: "",
      })));

      if (data?.source === "fallback") {
        toast({ title: "Using default drivers", description: "AI analysis unavailable — default drivers loaded. You can customize them.", variant: "default" });
      }

      setStep(1);
    } catch (err) {
      console.error("Driver proposal failed:", err);
      toast({ title: "Analysis failed", description: "Could not generate drivers. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleDriver = (idx: number) => {
    setDrivers(prev => prev.map((d, i) => i === idx ? { ...d, accepted: !d.accepted } : d));
  };

  const addCustomDriver = () => {
    if (!customName.trim()) return;
    setDrivers(prev => [...prev, {
      name: customName.trim(),
      rationale: customRationale.trim(),
      accepted: true,
      source: "user_defined",
      weight: null,
      trigger: "",
    }]);
    setCustomName("");
    setCustomRationale("");
  };

  const removeDriver = (idx: number) => {
    setDrivers(prev => prev.filter((_, i) => i !== idx));
  };

  const updateWeight = (idx: number, val: number | null) => {
    const globalIdx = drivers.indexOf(acceptedDrivers[idx]);
    setDrivers(prev => prev.map((d, i) => i === globalIdx ? { ...d, weight: val } : d));
  };

  const updateTrigger = (idx: number, val: string) => {
    const globalIdx = drivers.indexOf(acceptedDrivers[idx]);
    setDrivers(prev => prev.map((d, i) => i === globalIdx ? { ...d, trigger: val } : d));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onActivate({
        goods_definition: goodsDefinition.trim(),
        driver_count_target: acceptedDrivers.length,
        drivers: acceptedDrivers.map(d => ({
          driver_name: d.name,
          rationale: d.rationale || null,
          source: d.source,
          weight: d.weight,
          trigger_description: d.trigger || null,
        })),
      });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Goods Definition", "Driver Proposal", "Triggers", "Activate"];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <Badge
              variant={i === step ? "default" : i < step ? "secondary" : "outline"}
              className="whitespace-nowrap text-xs"
            >
              {i + 1}. {s}
            </Badge>
            {i < steps.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
          </div>
        ))}
      </div>

      {/* Step 0: Goods Definition */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What goods or service are you monitoring?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g. Industrial-grade polyethylene packaging film for food-contact applications"
                  value={goodsDefinition}
                  onChange={(e) => setGoodsDefinition(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button onClick={handleGoodsNext} disabled={!goodsDefinition.trim() || isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Analyzing price drivers…
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-iris/25 bg-iris/5 dark:bg-surface">
              <CardHeader>
                <CardTitle className="text-sm">What happens next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">1</Badge>
                  <p>Your description is sent to our AI analyst to identify the key cost drivers.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">2</Badge>
                  <p>You review, accept or reject each proposed driver and add your own.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">3</Badge>
                  <p>Assign weights and define trigger events for monitoring.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">4</Badge>
                  <p>Activate — the platform begins scanning for price-impacting events.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 1: Driver Proposal */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proposed Inflation Drivers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  These drivers were proposed based on your goods definition. Toggle to accept or reject each one.
                </p>
                <div className="space-y-3">
                  {drivers.map((d, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/60 bg-card space-y-2">
                      <div className="flex items-start gap-3">
                        <Switch checked={d.accepted} onCheckedChange={() => toggleDriver(i)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>
                          {d.source === "user_defined" && (
                            <Badge variant="outline" className="mt-1 text-xs">Custom</Badge>
                          )}
                        </div>
                      </div>
                      {d.accepted && (
                        <div className="pl-10 flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground shrink-0">Weight</Label>
                          <Slider
                            value={[d.weight ?? 50]}
                            onValueChange={([v]) => {
                              setDrivers(prev => prev.map((dr, di) => di === i ? { ...dr, weight: v } : dr));
                            }}
                            min={1}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs font-mono w-6 text-right text-foreground">{d.weight ?? "—"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add custom driver */}
                <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Add custom driver</p>
                  <Input placeholder="Driver name" value={customName} onChange={e => setCustomName(e.target.value)} />
                  <Input placeholder="Rationale (optional)" value={customRationale} onChange={e => setCustomRationale(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={addCustomDriver} disabled={!customName.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Add Driver
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(2)} disabled={acceptedDrivers.length === 0}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-iris/25 bg-iris/5 dark:bg-surface sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  AI-generated drivers based on your goods description. Each represents a measurable economic factor that influences cost.
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wider">On this step</p>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">1</Badge>
                    <p className="text-xs">Toggle drivers on/off and add custom ones.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">2</Badge>
                    <p className="text-xs">Adjust weight sliders to set relative importance.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">3</Badge>
                    <p className="text-xs">Click Next to define trigger events.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Trigger Definition */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trigger Definitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive" className="border-warning/40 bg-warning/5 text-warning">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This description is sent to public AI. Do not include confidential information.
                  </AlertDescription>
                </Alert>
                {acceptedDrivers.map((d, i) => (
                  <div key={i} className="space-y-1.5">
                    <Label className="text-sm font-medium">{d.name}</Label>
                    <Textarea
                      placeholder={i === 0 ? "Describe the event that would signal a change (e.g. 'Brent crude rises above $90/barrel')" : "Describe the event that would signal a change"}
                      value={d.trigger}
                      onChange={e => updateTrigger(i, e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(3)}>Review <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-iris/25 bg-iris/5 dark:bg-surface sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">Trigger Logic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Triggers define the real-world events that signal a price driver is changing. The system uses these descriptions to scan market data sources.
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wider">How triggers work</p>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">1</Badge>
                    <p className="text-xs">Each trigger is a plain-language description of a measurable market event.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">2</Badge>
                    <p className="text-xs">The AI scans public sources periodically to detect whether a trigger has occurred.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">3</Badge>
                    <p className="text-xs">When detected, the driver status changes and an alert is generated for review.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Be specific but avoid confidential details — triggers are processed by external AI.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Review & Activate */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review & Activate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">Goods / Service</p>
              <p className="text-sm font-medium text-foreground">{goodsDefinition}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{acceptedDrivers.length} Driver{acceptedDrivers.length !== 1 ? "s" : ""}</p>
              {acceptedDrivers.map((d, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    {d.weight != null && <Badge variant="secondary" className="text-xs">Weight: {d.weight}</Badge>}
                  </div>
                  {d.trigger && (
                    <p className="text-xs text-muted-foreground">Trigger: {d.trigger}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Rocket className="w-4 h-4 mr-1" />
                {isSubmitting ? "Activating…" : "Activate Tracker"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InflationSetupWizard;

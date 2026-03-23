import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import FileUploadZone from "./FileUploadZone";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { TrackerType, MonitorType, EntityType, ComparisonPeriod } from "@/hooks/useEnterpriseTrackers";

interface TrackerSetupWizardProps {
  trackerType: TrackerType;
  onActivate: (data: {
    name: string;
    parameters: Record<string, unknown>;
    files: File[];
  }) => Promise<unknown>;
  onComplete: () => void;
}

const STEP_LABELS = ["Monitor Type", "Input Blocks", "Files & Context", "Review & Activate"];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "supplier", label: "Supplier" },
  { value: "category", label: "Category" },
  { value: "contract", label: "Contract" },
  { value: "project", label: "Project" },
];

const PERIODS: { value: ComparisonPeriod; label: string }[] = [
  { value: "WoW", label: "Week-over-Week" },
  { value: "MoM", label: "Month-over-Month (default)" },
  { value: "QoQ", label: "Quarter-over-Quarter" },
  { value: "YoY", label: "Year-over-Year" },
];

const TrackerSetupWizard = ({
  trackerType,
  onActivate,
  onComplete,
}: TrackerSetupWizardProps) => {
  const [step, setStep] = useState(0);

  // Step 0 — Monitor type
  const [monitorType, setMonitorType] = useState<MonitorType | null>(null);

  // Step 1 — Input blocks (shared)
  const [name, setName] = useState("");

  // DM-1 fields
  const [hypothesis, setHypothesis] = useState("");
  const [contextConstraints, setContextConstraints] = useState("");
  const [existingEvidence, setExistingEvidence] = useState("");

  // DM-2 fields
  const [entityType, setEntityType] = useState<EntityType>("supplier");
  const [entityContext, setEntityContext] = useState("");
  const [riskData, setRiskData] = useState("");
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>("MoM");

  // Step 2 — Files
  const [files, setFiles] = useState<File[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [gdprChecked, setGdprChecked] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const canProceedStep0 = monitorType !== null;
  const canProceedStep1 = monitorType === "DM-1"
    ? name.trim().length > 0 && hypothesis.trim().length > 0 && contextConstraints.trim().length > 0
    : name.trim().length > 0 && entityContext.trim().length > 0;
  const canProceedStep2 = gdprChecked;

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      const parameters: Record<string, unknown> = {
        monitor_type: monitorType,
        default_period: comparisonPeriod,
      };

      if (monitorType === "DM-1") {
        parameters.hypothesis = hypothesis.trim();
        parameters.context_constraints = contextConstraints.trim();
        parameters.existing_evidence = existingEvidence.trim() || undefined;
      } else {
        parameters.entity_type = entityType;
        parameters.entity_context = entityContext.trim();
        parameters.risk_data = riskData.trim() || undefined;
      }

      if (additionalContext.trim()) {
        parameters.additional_context = additionalContext.trim();
      }

      await onActivate({ name: name.trim(), parameters, files });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <Badge
              variant={i === step ? "default" : i < step ? "secondary" : "outline"}
              className="text-xs"
            >
              {i + 1}
            </Badge>
            <span className={`text-sm ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      {/* Step 0: Monitor type selection */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Monitoring Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META["DM-1"]][]).map(([id, m]) => {
              const disabled = m.phase !== 1;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMonitorType(id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    monitorType === id
                      ? "border-primary bg-primary/5"
                      : disabled
                        ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                        : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={m.phase === 1 ? "default" : "outline"} className="text-[10px]">{id}</Badge>
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    {disabled && <Badge variant="outline" className="text-[10px] ml-auto">Coming Soon</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.purpose}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">DRS: {m.drs ? "Applied" : "Not applicable"}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Input blocks */}
      {step === 1 && monitorType === "DM-1" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM-1: Hypothesis Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monitor-name">Monitor Name</Label>
              <Input id="monitor-name" placeholder="e.g. Logistics Consolidation Hypothesis" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hypothesis">Block 1 — Hypothesis Statement</Label>
              <Textarea id="hypothesis" placeholder="A clear, falsifiable statement to test. e.g. 'Consolidating logistics suppliers from 4 to 2 will reduce transport costs by 15% within 12 months.'" value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground">The AI will present balanced evidence for and against — no recommendation is implied.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="context-constraints">Block 2 — Context & Constraints</Label>
              <Textarea id="context-constraints" placeholder="Industry, geography, current supplier landscape, known dependencies, regulatory or contractual constraints…" value={contextConstraints} onChange={(e) => setContextConstraints(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="existing-evidence">Block 3 — Evidence Already Held (optional)</Label>
              <Textarea id="existing-evidence" placeholder="Market data, historical results, pilot outcomes that support or contradict the hypothesis…" value={existingEvidence} onChange={(e) => setExistingEvidence(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && monitorType === "DM-2" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM-2: Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monitor-name-dm2">Monitor Name</Label>
              <Input id="monitor-name-dm2" placeholder="e.g. Acme Corp Supplier Risk Monitor" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((et) => (
                      <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comparison Period</Label>
                <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v as ComparisonPeriod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-context">Block 1 — Entity & Context</Label>
              <Textarea id="entity-context" placeholder="What is being assessed, industry, geography, relationship duration, key dependencies…" value={entityContext} onChange={(e) => setEntityContext(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-data">Block 2 — Risk Data (optional)</Label>
              <Textarea id="risk-data" placeholder="Known risk factors, performance KPIs, financial indicators, compliance status…" value={riskData} onChange={(e) => setRiskData(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground">
                Scored across 5 dimensions: Supply Continuity (25%), Financial Exposure (20%), Regulatory & Compliance (20%), Operational Performance (20%), Strategic Alignment (15%).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Files & Context */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Documents & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FileUploadZone files={files} onFilesChange={setFiles} />
            <div className="space-y-2">
              <Label htmlFor="additional-context">Additional Context (optional)</Label>
              <Textarea id="additional-context" placeholder="Any relevant context about your business, supply chain, or specific concerns..." value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} rows={3} />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <Checkbox id="gdpr-consent" checked={gdprChecked} onCheckedChange={(v) => setGdprChecked(v === true)} className="mt-0.5" />
              <Label htmlFor="gdpr-consent" className="text-sm leading-relaxed cursor-pointer">
                <ShieldCheck className="w-4 h-4 inline-block mr-1 text-success" />
                I confirm that all uploaded documents are free of personally identifiable information (PII) and comply with our GDPR guidelines.
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Activate */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review & Activate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium text-foreground">{name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type</span>
                <p className="font-medium text-foreground">
                  {monitorType} — {MONITOR_TYPE_META[monitorType!]?.label}
                </p>
              </div>
              {monitorType === "DM-1" && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Hypothesis</span>
                  <p className="font-medium text-foreground">{hypothesis}</p>
                </div>
              )}
              {monitorType === "DM-2" && (
                <>
                  <div>
                    <span className="text-muted-foreground">Entity Type</span>
                    <p className="font-medium text-foreground capitalize">{entityType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Period</span>
                    <p className="font-medium text-foreground">{comparisonPeriod}</p>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Files</span>
                <p className="font-medium text-foreground">
                  {files.length > 0 ? `${files.length} file(s) ready to upload` : "No files"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              step === 0 ? !canProceedStep0 :
              step === 1 ? !canProceedStep1 :
              !canProceedStep2
            }
            className="gap-1.5"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleActivate} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Activate Monitor
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrackerSetupWizard;

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

const STEP_LABELS = ["Monitoring Type", "Input Blocks", "Files & Context", "Review & Activate"];

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

  // DM-3 fields
  const [trackingSubject, setTrackingSubject] = useState("");
  const [baselineContext, setBaselineContext] = useState("");
  const [historicalData, setHistoricalData] = useState("");

  // DM-4 fields
  const [countryRegion, setCountryRegion] = useState("");
  const [geopoliticalContext, setGeopoliticalContext] = useState("");
  const [regulatoryNotes, setRegulatoryNotes] = useState("");

  // DM-5 fields
  const [industryScope, setIndustryScope] = useState("");
  const [marketContext, setMarketContext] = useState("");
  const [knownDisruptors, setKnownDisruptors] = useState("");

  // Step 2 — Files
  const [files, setFiles] = useState<File[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [gdprChecked, setGdprChecked] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const canProceedStep0 = monitorType !== null;

  const canProceedStep1 = (() => {
    if (!name.trim()) return false;
    switch (monitorType) {
      case "DM-1":
        return hypothesis.trim().length > 0 && contextConstraints.trim().length > 0;
      case "DM-2":
        return entityContext.trim().length > 0;
      case "DM-3":
        return trackingSubject.trim().length > 0 && baselineContext.trim().length > 0;
      case "DM-4":
        return countryRegion.trim().length > 0 && geopoliticalContext.trim().length > 0;
      case "DM-5":
        return industryScope.trim().length > 0 && marketContext.trim().length > 0;
      default:
        return false;
    }
  })();

  const canProceedStep2 = gdprChecked;

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      const parameters: Record<string, unknown> = {
        monitor_type: monitorType,
        default_period: comparisonPeriod,
      };

      switch (monitorType) {
        case "DM-1":
          parameters.hypothesis = hypothesis.trim();
          parameters.context_constraints = contextConstraints.trim();
          parameters.existing_evidence = existingEvidence.trim() || undefined;
          break;
        case "DM-2":
          parameters.entity_type = entityType;
          parameters.entity_context = entityContext.trim();
          parameters.risk_data = riskData.trim() || undefined;
          break;
        case "DM-3":
          parameters.tracking_subject = trackingSubject.trim();
          parameters.baseline_context = baselineContext.trim();
          parameters.historical_data = historicalData.trim() || undefined;
          break;
        case "DM-4":
          parameters.country_region = countryRegion.trim();
          parameters.geopolitical_context = geopoliticalContext.trim();
          parameters.regulatory_notes = regulatoryNotes.trim() || undefined;
          break;
        case "DM-5":
          parameters.industry_scope = industryScope.trim();
          parameters.market_context = marketContext.trim();
          parameters.known_disruptors = knownDisruptors.trim() || undefined;
          break;
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
    <div className="space-y-4">
      {/* Header row: title + step indicators */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-foreground">Set up New Monitor</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <Badge
                variant={i === step ? "default" : i < step ? "secondary" : "outline"}
                className="text-[10px] h-4 w-4 p-0 flex items-center justify-center"
              >
                {i + 1}
              </Badge>
              <span className={`text-xs ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && <span className="text-muted-foreground/50 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Monitor type selection */}
      {step === 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            {(Object.entries(MONITOR_TYPE_META) as [MonitorType, typeof MONITOR_TYPE_META["DM-1"]][]).map(([id, m]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMonitorType(id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors bg-muted/60 dark:bg-white/5 ${
                  monitorType === id
                    ? "border-primary bg-primary/10 dark:bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px]">{id}</Badge>
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.purpose}</p>
              </button>
            ))}
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
              <Label htmlFor="monitor-name">Monitoring Name</Label>
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
              <Label htmlFor="monitor-name-dm2">Monitoring Name</Label>
              <Input id="monitor-name-dm2" placeholder="e.g. Acme Corp Supplier Risk Monitoring" value={name} onChange={(e) => setName(e.target.value)} />
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

      {step === 1 && monitorType === "DM-3" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM-3: Risk Dynamics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monitor-name-dm3">Monitoring Name</Label>
              <Input id="monitor-name-dm3" placeholder="e.g. Q2 Supply Chain Risk Trajectory" value={name} onChange={(e) => setName(e.target.value)} />
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
            <div className="space-y-2">
              <Label htmlFor="tracking-subject">Block 1 — Tracking Subject</Label>
              <Textarea id="tracking-subject" placeholder="What risk trajectory are you tracking? e.g. 'Single-source dependency for critical electronic components in our automotive division.'" value={trackingSubject} onChange={(e) => setTrackingSubject(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground">Define the specific risk area whose trajectory you want to monitor over time.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseline-context">Block 2 — Baseline & Context</Label>
              <Textarea id="baseline-context" placeholder="Current risk posture, known mitigation measures, historical trends, comparison benchmarks…" value={baselineContext} onChange={(e) => setBaselineContext(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="historical-data">Block 3 — Historical Data (optional)</Label>
              <Textarea id="historical-data" placeholder="Past incidents, trend data, previous assessments or audit results…" value={historicalData} onChange={(e) => setHistoricalData(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && monitorType === "DM-4" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM-4: Country / Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monitor-name-dm4">Monitoring Name</Label>
              <Input id="monitor-name-dm4" placeholder="e.g. DACH Region Regulatory Risk Monitoring" value={name} onChange={(e) => setName(e.target.value)} />
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
            <div className="space-y-2">
              <Label htmlFor="country-region">Block 1 — Country / Region</Label>
              <Textarea id="country-region" placeholder="Which country or region to monitor? e.g. 'Turkey — key sourcing geography for textiles and automotive components.'" value={countryRegion} onChange={(e) => setCountryRegion(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground">Covers geopolitical, regulatory, logistics, and macroeconomic risk signals for the specified geography.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="geopolitical-context">Block 2 — Geopolitical & Business Context</Label>
              <Textarea id="geopolitical-context" placeholder="Your exposure in this geography, active suppliers, contracts, trade routes, known regulatory changes…" value={geopoliticalContext} onChange={(e) => setGeopoliticalContext(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regulatory-notes">Block 3 — Regulatory Notes (optional)</Label>
              <Textarea id="regulatory-notes" placeholder="Upcoming legislation, sanctions, tariff changes, trade agreements under negotiation…" value={regulatoryNotes} onChange={(e) => setRegulatoryNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && monitorType === "DM-5" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DM-5: Industry Dynamics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monitor-name-dm5">Monitoring Name</Label>
              <Input id="monitor-name-dm5" placeholder="e.g. Semiconductor Industry Risk Monitoring" value={name} onChange={(e) => setName(e.target.value)} />
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
            <div className="space-y-2">
              <Label htmlFor="industry-scope">Block 1 — Industry & Scope</Label>
              <Textarea id="industry-scope" placeholder="Which industry or sub-sector to monitor? e.g. 'European pharmaceutical packaging — glass vials and pre-filled syringes.'" value={industryScope} onChange={(e) => setIndustryScope(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground">Tracks industry-level risk signals, structural shifts, M&A activity, and capacity changes.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="market-context">Block 2 — Market & Competitive Context</Label>
              <Textarea id="market-context" placeholder="Your position in this industry, key competitors, supply-demand dynamics, technology shifts…" value={marketContext} onChange={(e) => setMarketContext(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="known-disruptors">Block 3 — Known Disruptors (optional)</Label>
              <Textarea id="known-disruptors" placeholder="Emerging technologies, new entrants, regulatory shifts, sustainability mandates…" value={knownDisruptors} onChange={(e) => setKnownDisruptors(e.target.value)} rows={2} />
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
              {monitorType === "DM-3" && (
                <>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Tracking Subject</span>
                    <p className="font-medium text-foreground">{trackingSubject}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Period</span>
                    <p className="font-medium text-foreground">{comparisonPeriod}</p>
                  </div>
                </>
              )}
              {monitorType === "DM-4" && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Country / Region</span>
                  <p className="font-medium text-foreground">{countryRegion}</p>
                </div>
              )}
              {monitorType === "DM-5" && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Industry Scope</span>
                  <p className="font-medium text-foreground">{industryScope}</p>
                </div>
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
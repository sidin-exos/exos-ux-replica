import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import FileUploadZone from "./FileUploadZone";
import type { TrackerType } from "@/hooks/useEnterpriseTrackers";

interface TrackerSetupWizardProps {
  trackerType: TrackerType;
  onActivate: (data: {
    name: string;
    parameters: Record<string, unknown>;
    files: File[];
  }) => Promise<unknown>;
  onComplete: () => void;
}

const STEP_LABELS = ["Parameters", "Files & Context", "Review & Activate"];

const TrackerSetupWizard = ({
  trackerType,
  onActivate,
  onComplete,
}: TrackerSetupWizardProps) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goods, setGoods] = useState("");
  const [context, setContext] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [gdprChecked, setGdprChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceedStep0 = name.trim().length > 0 && goods.trim().length > 0;
  const canProceedStep1 = gdprChecked;

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      await onActivate({
        name: name.trim(),
        parameters: {
          goods_services: goods.trim(),
          additional_context: context.trim() || undefined,
        },
        files,
      });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
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

      {/* Step 0: Parameters */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Define Tracker Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracker-name">Tracker Name</Label>
              <Input
                id="tracker-name"
                placeholder={trackerType === "risk" ? "Q2 Supply Chain Risk Monitor" : "Raw Materials Inflation Tracker"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goods">
                {trackerType === "risk" ? "Goods / Services / Categories to Monitor" : "Goods / Commodities to Track"}
              </Label>
              <Textarea
                id="goods"
                placeholder={
                  trackerType === "risk"
                    ? "e.g. Electronic components, logistics services, raw steel"
                    : "e.g. Copper, crude oil, semiconductor wafers, packaging materials"
                }
                value={goods}
                onChange={(e) => setGoods(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Files & Context */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Documents & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FileUploadZone files={files} onFilesChange={setFiles} />

            <div className="space-y-2">
              <Label htmlFor="context">Additional Context (optional)</Label>
              <Textarea
                id="context"
                placeholder="Provide any relevant context about your business, supply chain, or specific concerns..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <Checkbox
                id="gdpr-consent"
                checked={gdprChecked}
                onCheckedChange={(v) => setGdprChecked(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="gdpr-consent" className="text-sm leading-relaxed cursor-pointer">
                <ShieldCheck className="w-4 h-4 inline-block mr-1 text-success" />
                I confirm that all uploaded documents are free of personally identifiable
                information (PII) and comply with our GDPR guidelines.
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review & Activate */}
      {step === 2 && (
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
                <p className="font-medium text-foreground capitalize">{trackerType}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Monitoring</span>
                <p className="font-medium text-foreground">{goods}</p>
              </div>
              {context && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Context</span>
                  <p className="font-medium text-foreground">{context}</p>
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
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {step < 2 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
            className="gap-1.5"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleActivate}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Activate Tracker
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrackerSetupWizard;

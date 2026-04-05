import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ConsentBlockProps {
  consentTerms: boolean;
  consentDataProcessing: boolean;
  consentMarketing: boolean;
  onConsentTermsChange: (v: boolean) => void;
  onConsentDataProcessingChange: (v: boolean) => void;
  onConsentMarketingChange: (v: boolean) => void;
}

const ConsentBlock = ({
  consentTerms,
  consentDataProcessing,
  consentMarketing,
  onConsentTermsChange,
  onConsentDataProcessingChange,
  onConsentMarketingChange,
}: ConsentBlockProps) => {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-primary font-medium">
        Consent & Privacy
      </p>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={consentTerms}
          onCheckedChange={(v) => onConsentTermsChange(!!v)}
          className="mt-0.5"
        />
        <span className="text-sm leading-snug text-foreground">
          I agree to the{" "}
          <a href="/terms" className="text-primary underline underline-offset-2" target="_blank">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary underline underline-offset-2" target="_blank">
            Privacy Policy
          </a>
          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-destructive text-destructive">
            Required
          </Badge>
        </span>
      </label>

      {/* Data Processing */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={consentDataProcessing}
          onCheckedChange={(v) => onConsentDataProcessingChange(!!v)}
          className="mt-0.5"
        />
        <span className="text-sm leading-snug text-foreground flex items-start gap-1">
          <span>
            I consent to EXOS processing my data for service delivery
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-destructive text-destructive">
              Required
            </Badge>
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Your data is processed in accordance with GDPR. We use it solely to provide the EXOS procurement intelligence service. You can request deletion at any time.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      </label>

      {/* Marketing */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={consentMarketing}
          onCheckedChange={(v) => onConsentMarketingChange(!!v)}
          className="mt-0.5"
        />
        <span className="text-sm leading-snug text-foreground">
          I'd like to receive product updates and procurement insights
          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-muted-foreground text-muted-foreground">
            Optional
          </Badge>
        </span>
      </label>
    </div>
  );
};

export default ConsentBlock;

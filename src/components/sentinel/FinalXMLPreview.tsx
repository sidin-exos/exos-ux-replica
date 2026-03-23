/**
 * Final XML Preview Component
 * 
 * Shows the complete XML that will be sent to the AI engine after form is filled.
 * Hidden in shareable mode for IP protection.
 * Adapted for narrow 1/3 sidebar layout.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileOutput, Eye, Code, CheckCircle, AlertCircle } from "lucide-react";
import { useShareableMode } from "@/hooks/useShareableMode";
import type { IndustryContext, ProcurementCategory } from "@/lib/ai-context-templates";
import { generateGroundedPrompt } from "@/lib/sentinel/grounding";
import { anonymize, DEFAULT_ANONYMIZATION_CONFIG } from "@/lib/sentinel/anonymizer";

interface FinalXMLPreviewProps {
  scenarioType: string;
  scenarioData: Record<string, string>;
  industry: IndustryContext | null;
  category: ProcurementCategory | null;
  strategyValue?: string;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type ReadinessStatus = "empty" | "almost" | "ready";

function deriveReadiness(scenarioData: Record<string, string>): ReadinessStatus {
  const entries = Object.entries(scenarioData);
  if (entries.length === 0) return "empty";

  const filledEntries = entries.filter(([, v]) => v && v.trim());
  if (filledEntries.length === 0) return "empty";

  const allFilled = filledEntries.length === entries.length;
  if (!allFilled) return "empty";

  const allMeetMinWords = filledEntries.every(([, v]) => wordCount(v) >= 30);
  if (allMeetMinWords) return "ready";

  return "almost";
}

function generateFinalXML(
  scenarioType: string,
  scenarioData: Record<string, string>,
  industry: IndustryContext | null,
  category: ProcurementCategory | null
): { xml: string; anonymizedInput: string; entitiesFound: number } {
  const rawInput = Object.entries(scenarioData)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const anonymizationResult = anonymize(rawInput, DEFAULT_ANONYMIZATION_CONFIG);
  const groundedPrompt = generateGroundedPrompt(
    anonymizationResult.anonymizedText,
    scenarioType,
    scenarioData,
    industry,
    category
  );

  return {
    xml: groundedPrompt,
    anonymizedInput: anonymizationResult.anonymizedText,
    entitiesFound: anonymizationResult.metadata.entitiesFound,
  };
}

function SummarizedPreview({
  scenarioType,
  scenarioData,
  industry,
  category,
  entitiesFound,
}: {
  scenarioType: string;
  scenarioData: Record<string, string>;
  industry: IndustryContext | null;
  category: ProcurementCategory | null;
  entitiesFound: number;
}) {
  const filledFields = Object.entries(scenarioData).filter(
    ([, value]) => value && value.trim()
  );

  return (
    <div className="space-y-3">
      {/* Scenario & Grounding */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Scenario
        </p>
        <Badge variant="secondary" className="text-xs">{scenarioType}</Badge>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Grounding
        </p>
        <div className="flex flex-wrap gap-1">
          {industry ? (
            <Badge variant="outline" className="text-[10px]">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5 text-green-500" />
              {industry.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
              No industry
            </Badge>
          )}
          {category ? (
            <Badge variant="outline" className="text-[10px]">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5 text-green-500" />
              {category.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
              No category
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Anonymization
        </p>
        <Badge variant={entitiesFound > 0 ? "default" : "outline"} className="text-[10px]">
          {entitiesFound} entities masked
        </Badge>
      </div>

      {/* LLM Config — stacked for narrow layout */}
      <div className="p-2 rounded-md bg-muted/30 border border-border space-y-2">
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            LLM Settings
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">Temp: 0.2</Badge>
            <Badge variant="outline" className="text-[10px]">Anti-Hallucination</Badge>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Chain-of-Experts
          </p>
          <div className="flex flex-wrap items-center gap-0.5 text-[10px]">
            <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">Auditor</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">Optimizer</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">Strategist</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">Validator</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Output Mode
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">Quantitative</Badge>
            <Badge variant="outline" className="text-[10px]">Conservative</Badge>
          </div>
        </div>
      </div>

      {/* User Input Fields */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          User Input Fields ({filledFields.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {filledFields.slice(0, 6).map(([key]) => (
            <span
              key={key}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border truncate max-w-[120px] inline-block"
            >
              {key}
            </span>
          ))}
          {filledFields.length > 6 && (
            <span className="text-[10px] text-muted-foreground">
              +{filledFields.length - 6} more
            </span>
          )}
        </div>
      </div>

      <div className="p-1.5 rounded-md bg-primary/5 border border-primary/20">
        <p className="text-[10px] text-muted-foreground">
          <strong>Loop-back:</strong> Validator → Auditor on inconsistency.
        </p>
      </div>
    </div>
  );
}

export function FinalXMLPreview({
  scenarioType,
  scenarioData,
  industry,
  category,
}: FinalXMLPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "xml">("preview");
  const { showTechnicalDetails } = useShareableMode();

  const { xml, entitiesFound } = useMemo(
    () => generateFinalXML(scenarioType, scenarioData, industry, category),
    [scenarioType, scenarioData, industry, category]
  );

  const readiness = useMemo(
    () => deriveReadiness(scenarioData),
    [scenarioData]
  );

  if (!showTechnicalDetails) {
    return null;
  }

  const hasData = Object.values(scenarioData).some((v) => v && v.trim());

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-accent/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2 px-3">
            <CardTitle className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <FileOutput className="h-3.5 w-3.5 text-accent" />
                Final XML
              </span>
              <div className="flex items-center gap-1.5">
                {readiness === "ready" ? (
                  <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                    Ready
                  </Badge>
                ) : readiness === "almost" ? (
                  <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    Almost ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Fill form first
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-3 pb-3">
            {!hasData ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Fill in the form fields to see the final XML.
              </p>
            ) : (
              <>
                <div className="flex gap-1.5 mb-2">
                  <Button
                    variant={viewMode === "preview" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-2.5 w-2.5 mr-0.5" />
                    Summary
                  </Button>
                  <Button
                    variant={viewMode === "xml" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setViewMode("xml")}
                  >
                    <Code className="h-2.5 w-2.5 mr-0.5" />
                    Full XML
                  </Button>
                </div>

                {viewMode === "preview" ? (
                  <SummarizedPreview
                    scenarioType={scenarioType}
                    scenarioData={scenarioData}
                    industry={industry}
                    category={category}
                    entitiesFound={entitiesFound}
                  />
                ) : (
                  <ScrollArea className="h-64">
                    <pre className="text-[10px] bg-muted p-2 rounded-md overflow-x-auto font-mono whitespace-pre-wrap">
                      {xml}
                    </pre>
                  </ScrollArea>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

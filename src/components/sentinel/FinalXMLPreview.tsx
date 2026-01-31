/**
 * Final XML Preview Component
 * 
 * Shows the complete XML that will be sent to the AI engine after form is filled.
 * Hidden in shareable mode for IP protection.
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

/**
 * Generate the final XML with actual data, using grounding as sub-function reference
 */
function generateFinalXML(
  scenarioType: string,
  scenarioData: Record<string, string>,
  industry: IndustryContext | null,
  category: ProcurementCategory | null
): { xml: string; anonymizedInput: string; entitiesFound: number } {
  // Build raw input from scenario data
  const rawInput = Object.entries(scenarioData)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // Anonymize the input
  const anonymizationResult = anonymize(rawInput, DEFAULT_ANONYMIZATION_CONFIG);

  // Generate the grounded prompt
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

/**
 * Summarized preview showing key details without full XML
 */
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Scenario
          </p>
          <Badge variant="secondary">{scenarioType}</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Grounding
          </p>
          <div className="flex flex-wrap gap-1">
            {industry ? (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {industry.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                No industry
              </Badge>
            )}
            {category ? (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {category.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                No category
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Anonymization
          </p>
          <Badge variant={entitiesFound > 0 ? "default" : "outline"} className="text-xs">
            {entitiesFound} entities masked
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          User Input Fields ({filledFields.length})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {filledFields.slice(0, 6).map(([key]) => (
            <div
              key={key}
              className="text-xs px-2 py-1 rounded-md bg-muted border border-border truncate"
            >
              {key}
            </div>
          ))}
          {filledFields.length > 6 && (
            <div className="text-xs px-2 py-1 text-muted-foreground">
              +{filledFields.length - 6} more
            </div>
          )}
        </div>
      </div>

      <div className="p-2 rounded-md bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong>AI Context Grounding</strong> is embedded as a sub-function. 
          Switch to XML view to see the full prompt structure.
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

  // Generate the final XML
  const { xml, entitiesFound } = useMemo(
    () => generateFinalXML(scenarioType, scenarioData, industry, category),
    [scenarioType, scenarioData, industry, category]
  );

  // Hide entirely in shareable mode
  if (!showTechnicalDetails) {
    return null;
  }

  // Check if there's any data to show
  const hasData = Object.values(scenarioData).some((v) => v && v.trim());

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-accent/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FileOutput className="h-4 w-4 text-accent" />
                Final XML to AI Engine
              </span>
              <div className="flex items-center gap-2">
                {hasData ? (
                  <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Fill form first
                  </Badge>
                )}
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
          <CardContent className="pt-0">
            {!hasData ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Fill in the form fields above to see the final XML that will be sent to the AI engine.
              </p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={viewMode === "preview" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Summary
                  </Button>
                  <Button
                    variant={viewMode === "xml" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("xml")}
                  >
                    <Code className="h-3 w-3 mr-1" />
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
                  <ScrollArea className="h-80">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap">
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

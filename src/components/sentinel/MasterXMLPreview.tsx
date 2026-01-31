/**
 * Master XML Prompt Template Preview
 * 
 * Displays the XML prompt structure/template that will be used for AI analysis.
 * Hidden in shareable mode for IP protection.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileCode, Eye, Code } from "lucide-react";
import { useShareableMode } from "@/hooks/useShareableMode";

interface MasterXMLPreviewProps {
  scenarioType: string;
}

/**
 * Generate the master XML template structure (with placeholders)
 */
function generateMasterTemplate(scenarioType: string): string {
  return `<grounded-analysis-request>

  <analysis-context scenario-type="${scenarioType}">
    
    <!-- AI Context Grounding (sub-function) -->
    <grounding-reference>
      <industry-context ref="selected-industry" />
      <category-context ref="selected-category" />
    </grounding-reference>

    <!-- User Input Data -->
    <user-input>
      <field name="{field_name}">{field_value}</field>
      <!-- Additional fields populated from form -->
    </user-input>

    <cross-reference-instructions>
      <instruction>Cross-reference user inputs with industry constraints</instruction>
      <instruction>Identify opportunities based on category benchmarks</instruction>
      <instruction>Suggest best practices from analogous categories</instruction>
      <instruction>Provide quantified recommendations where KPIs allow</instruction>
    </cross-reference-instructions>

  </analysis-context>

  <!-- Historical Context (from vector DB) -->
  <historical-context>
    <case id="{case_id}" relevance="{score}">
      {historical_case_content}
    </case>
  </historical-context>

  <!-- Benchmark Context (from reference DB) -->
  <benchmark-context>
    <benchmark id="{bench_id}" relevance="{score}">
      {benchmark_content}
    </benchmark>
  </benchmark-context>

  <!-- Anonymized User Query -->
  <anonymized-user-query>
    {anonymized_input_with_masked_tokens}
  </anonymized-user-query>

  <!-- Processing Instructions -->
  <processing-instructions>
    <instruction>Analyze query using industry and category context</instruction>
    <instruction>Reference historical cases when making recommendations</instruction>
    <instruction>Quantify recommendations using provided benchmarks</instruction>
    <instruction>Maintain all masked tokens exactly as provided</instruction>
    <instruction>Structure response: Analysis, Recommendations, Risks, Next Steps</instruction>
  </processing-instructions>

</grounded-analysis-request>`;
}

/**
 * Preview mode content showing the template structure explained
 */
function TemplatePreviewContent({ scenarioType }: { scenarioType: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Badge variant="secondary">Scenario</Badge>
          {scenarioType}
        </h4>
        <p className="text-xs text-muted-foreground">
          This template structures the AI request with grounding context and processing instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Core Components</p>
          <ul className="text-xs space-y-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Grounding Reference (industry + category)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>User Input Fields</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Cross-Reference Instructions</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Enrichment Layers</p>
          <ul className="text-xs space-y-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Historical Cases (vector search)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Benchmark Data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Processing Instructions</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-2 rounded-md bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> AI Context Grounding (industry constraints, KPIs, category characteristics) 
          is embedded as a sub-function reference to keep the template readable.
        </p>
      </div>
    </div>
  );
}

export function MasterXMLPreview({ scenarioType }: MasterXMLPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "xml">("preview");
  const { showTechnicalDetails } = useShareableMode();

  // Hide entirely in shareable mode
  if (!showTechnicalDetails) {
    return null;
  }

  const template = generateMasterTemplate(scenarioType);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-primary/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                Master XML Prompt Template
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Template
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
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-3">
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === "xml" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("xml")}
              >
                <Code className="h-3 w-3 mr-1" />
                XML
              </Button>
            </div>

            {viewMode === "preview" ? (
              <TemplatePreviewContent scenarioType={scenarioType} />
            ) : (
              <ScrollArea className="h-72">
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap">
                  {template}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

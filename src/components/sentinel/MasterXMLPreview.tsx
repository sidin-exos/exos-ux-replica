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

const SUPERADMIN_EMAIL = "andrei.sidin@gmail.com";

interface MasterXMLPreviewProps {
  scenarioType: string;
  userEmail?: string | null;
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

  </analysis-context>

  <!-- Historical Context (from vector DB) -->
  <historical-context>
    <case id="{case_id}" relevance="{score}">{content}</case>
  </historical-context>

  <!-- Benchmark Context (from reference DB) -->
  <benchmark-context>
    <benchmark id="{bench_id}" relevance="{score}">{content}</benchmark>
  </benchmark-context>

  <!-- Anonymized User Query -->
  <anonymized-user-query>
    {anonymized_input_with_masked_tokens}
  </anonymized-user-query>

  <!-- LLM Configuration Settings -->
  <llm-configuration>
    
    <!-- Precision Mode: Low temperature for factual outputs -->
    <temperature value="0.2" mode="precise">
      Minimize creativity and speculation. Prioritize factual accuracy.
    </temperature>

    <!-- Chain-of-Experts Protocol -->
    <chain-of-experts mode="sequential-validation">
      <expert role="Auditor" order="1">
        Verify data accuracy, check inconsistencies, flag missing info
      </expert>
      <expert role="Optimizer" order="2">
        Identify savings, suggest improvements, quantify impact
      </expert>
      <expert role="Strategist" order="3">
        Develop negotiation strategy, assess risks, prioritize actions
      </expert>
      <expert role="Validator" order="4">
        Cross-check against benchmarks, ensure logical consistency
      </expert>
      <loop-back trigger="inconsistency-detected" target="Auditor" />
    </chain-of-experts>

    <!-- Anti-Hallucination Safeguards -->
    <anti-hallucination mode="strict">
      <rule>Only cite specific data points from provided context</rule>
      <rule>Flag uncertainty with confidence levels</rule>
      <rule>Distinguish facts from inferences</rule>
      <rule>Reject requests requiring external knowledge</rule>
    </anti-hallucination>

    <!-- Output Constraints -->
    <output-constraints>
      <quantitative-focus>Numerical estimates with ranges</quantitative-focus>
      <conservative-assumptions>Cautious savings projections</conservative-assumptions>
      <source-citation>Reference specific input data points</source-citation>
    </output-constraints>
    
  </llm-configuration>

  <!-- Processing Instructions -->
  <processing-instructions>
    <instruction>Apply Chain-of-Experts validation loop</instruction>
    <instruction>Reference historical cases and benchmarks</instruction>
    <instruction>Maintain all masked tokens exactly as provided</instruction>
    <instruction>Structure: Analysis, Recommendations, Risks, Next Steps</instruction>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Context Layers</p>
          <ul className="text-xs space-y-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Grounding (industry + category)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Historical Cases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Benchmark Data</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">LLM Settings</p>
          <ul className="text-xs space-y-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Temperature: 0.2 (Precise)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Anti-Hallucination: Strict</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>Output: Quantitative Focus</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Chain-of-Experts</p>
          <ul className="text-xs space-y-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span>1. Auditor → Verify data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span>2. Optimizer → Find savings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span>3. Strategist → Plan actions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span>4. Validator → Cross-check</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-2 rounded-md bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Loop-back:</strong> If Validator detects inconsistency → returns to Auditor for re-verification.
          AI Context Grounding is embedded as a sub-function reference.
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

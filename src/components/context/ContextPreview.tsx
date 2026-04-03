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
import { ChevronDown, ChevronUp, Code, Eye } from "lucide-react";
import {
  useIndustryContext,
  useProcurementCategory,
} from "@/hooks/useContextData";
import {
  generateIndustryContextXML,
  generateCategoryContextXML,
} from "@/lib/ai-context-templates";
import { useShareableMode } from "@/hooks/useShareableMode";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ContextPreviewProps {
  industrySlug: string | null;
  categorySlug: string | null;
  showXML?: boolean;
}

export function ContextPreview({
  industrySlug,
  categorySlug,
  showXML = false,
}: ContextPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "xml">("preview");
  const { showTechnicalDetails } = useShareableMode();
  const { isSuperAdmin } = useAdminAuth();

  const { data: industry } = useIndustryContext(industrySlug);
  const { data: category } = useProcurementCategory(categorySlug);

  // Hide XML option for non-super-admin users and in shareable mode
  const canShowXML = showXML && showTechnicalDetails && isSuperAdmin;

  if (!industry && !category) {
    return null;
  }

  const hasV2Industry = industry?.constraints_v2 && industry.constraints_v2.length > 0;
  const hasV2Category = category?.kpis_v2 && category.kpis_v2.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                AI Context Grounding Preview
                {(hasV2Industry || hasV2Category) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">v2</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {industry && (
                  <Badge variant="secondary" className="text-xs">
                    {industry.name}
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category.name}
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
            {canShowXML && (
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
            )}
            

            {viewMode === "preview" || !canShowXML ? (
              <div className="space-y-4">
                {industry && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      Industry: {industry.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Key Constraints
                        </p>
                        <ul className="text-xs space-y-1">
                          {hasV2Industry ? (
                            industry.constraints_v2!.slice(0, 5).map((c, i) => (
                              <li key={i} className="text-muted-foreground flex items-center gap-1">
                                {c.blocker && <span className="text-destructive font-bold">⛔</span>}
                                {c.tier && <span className="font-semibold text-[10px]">[{c.tier}]</span>}
                                <span>• {c.label}</span>
                              </li>
                            ))
                          ) : (
                            industry.constraints.slice(0, 5).map((c, i) => (
                              <li key={i} className="text-muted-foreground">
                                • {c}
                              </li>
                            ))
                          )}
                          {(hasV2Industry ? industry.constraints_v2! : industry.constraints).length > 5 && (
                            <li className="text-muted-foreground italic">
                              +{(hasV2Industry ? industry.constraints_v2! : industry.constraints).length - 5} more...
                            </li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Key KPIs
                        </p>
                        <ul className="text-xs space-y-1">
                          {industry.kpis.slice(0, 5).map((k, i) => (
                            <li key={i} className="text-muted-foreground">
                              • {k}
                            </li>
                          ))}
                          {industry.kpis.length > 5 && (
                            <li className="text-muted-foreground italic">
                              +{industry.kpis.length - 5} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {category && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Category: {category.name}
                      {category.kraljic_position && (
                        <Badge variant="outline" className="text-xs py-0">{category.kraljic_position}</Badge>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {category.characteristics}
                    </p>
                    {category.eu_regulatory_context && (
                      <p className="text-xs text-info">
                        🇪🇺 {category.eu_regulatory_context}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Category KPIs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.kpis.map((k, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs py-0"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ScrollArea className="h-64">
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono">
                  {industry && generateIndustryContextXML(industry)}
                  {industry && category && "\n\n"}
                  {category && generateCategoryContextXML(category)}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

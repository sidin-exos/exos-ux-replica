import { useState } from "react";
import { format } from "date-fns";
import { Lightbulb, ChevronDown, ChevronUp, ExternalLink, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { MarketInsight } from "@/hooks/useMarketInsights";

interface MarketInsightsBannerProps {
  insight: MarketInsight;
  onActivate?: () => void;
  isActivated?: boolean;
  className?: string;
}

export function MarketInsightsBanner({
  insight,
  onActivate,
  isActivated = false,
  className,
}: MarketInsightsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lastUpdated = new Date(insight.created_at);
  const confidencePercent = Math.round(insight.confidence_score * 100);

  return (
    <Card className={cn(
      "border-primary/20 bg-primary/5 transition-all",
      isActivated && "border-primary bg-primary/10",
      className
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Market Insights Available
                  <Badge variant="secondary" className="text-xs">
                    {confidencePercent}% confidence
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {insight.industry_name} × {insight.category_name} • Updated {format(lastUpdated, "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isActivated && onActivate && (
                <Button size="sm" onClick={onActivate}>
                  Use Market Insights
                </Button>
              )}
              {isActivated && (
                <Badge className="bg-primary text-primary-foreground">
                  Active
                </Badge>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-4">
            {/* Key Trends */}
            {insight.key_trends.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  Key Trends
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {insight.key_trends.slice(0, 3).map((trend, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Signals */}
            {insight.risk_signals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Risk Signals
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {insight.risk_signals.slice(0, 3).map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {insight.opportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  Opportunities
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {insight.opportunities.slice(0, 3).map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations */}
            {insight.citations.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Sources ({insight.citations.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insight.citations.slice(0, 5).map((citation) => {
                    const domain = new URL(citation.url).hostname.replace("www.", "");
                    return (
                      <a
                        key={citation.index}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        [{citation.index}] {domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

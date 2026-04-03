import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Building2, 
  TrendingUp, 
  BarChart3, 
  Scale, 
  GitMerge, 
  AlertTriangle,
  Search,
  ChevronDown,
  Loader2,
  X
} from "lucide-react";
import {
  type QueryType,
  type RecencyFilter,
  type IntelQueryParams,
  QUERY_TYPE_LABELS,
  RECENCY_OPTIONS,
  DOMAIN_OPTIONS,
} from "@/hooks/useMarketIntelligence";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  TrendingUp,
  BarChart3,
  Scale,
  GitMerge,
  AlertTriangle,
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  supplier:   { bg: "bg-info/15",       border: "border-info",       text: "text-info" },
  commodity:  { bg: "bg-warning/15",    border: "border-warning",    text: "text-warning" },
  industry:   { bg: "bg-highlight/15",  border: "border-highlight",  text: "text-highlight" },
  regulatory: { bg: "bg-iris/15",       border: "border-iris",       text: "text-iris" },
  "m&a":      { bg: "bg-accent/15",     border: "border-accent",     text: "text-accent" },
  risk:       { bg: "bg-destructive/15",border: "border-destructive",text: "text-destructive" },
};

interface QueryBuilderProps {
  onSubmit: (params: IntelQueryParams) => void;
  isLoading: boolean;
  renderBeforeSubmit?: React.ReactNode;
}

export function QueryBuilder({ onSubmit, isLoading, renderBeforeSubmit }: QueryBuilderProps) {
  const [queryType, setQueryType] = useState<QueryType>("supplier");
  const [queryName, setQueryName] = useState("");
  const [queryText, setQueryText] = useState("");
  const [recencyFilter, setRecencyFilter] = useState<string>("__none__");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    onSubmit({
      queryType,
      queryName: queryName.trim() || undefined,
      query: queryText.trim(),
      recencyFilter: recencyFilter === "__none__" ? undefined : recencyFilter as RecencyFilter,
      domainFilter: selectedDomains.length > 0 ? selectedDomains : undefined,
      context: context.trim() || undefined,
    });
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const currentType = QUERY_TYPE_LABELS[queryType];
  const IconComponent = ICONS[currentType.icon];
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Intelligence Query
        </CardTitle>
        <CardDescription>
          Search for real-time market intelligence powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Query Type Selection */}
          <div className="space-y-3">
            <Label>Intelligence Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.entries(QUERY_TYPE_LABELS) as [QueryType, typeof QUERY_TYPE_LABELS[QueryType]][]).map(([type, info]) => {
                const Icon = ICONS[info.icon];
                const isSelected = queryType === type;
                const colors = TYPE_COLORS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQueryType(type)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${colors.border} ${colors.bg} text-foreground ring-1 ring-offset-1 ring-offset-background ${colors.border.replace('border-', 'ring-')}`
                        : "border-border hover:border-muted-foreground/40 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {Icon && <Icon className={`w-4 h-4 ${isSelected ? colors.text : "text-muted-foreground"}`} />}
                      <span className={`font-medium text-sm ${isSelected ? colors.text : ""}`}>{info.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Input */}
          <div className="space-y-2">
            <Label htmlFor="query">Your Query</Label>
            <div className="relative">
              {IconComponent && (
                <IconComponent className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              )}
              <Textarea
                id="query"
                placeholder={getPlaceholder(queryType)}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="pl-10 min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Recency Filter */}
          <div className="space-y-2">
            <Label>Time Range</Label>
            <Select
              value={recencyFilter}
              onValueChange={setRecencyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any time</SelectItem>
                {RECENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" type="button" className="w-full justify-between">
                Advanced Options
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Domain Filter */}
              <div className="space-y-2">
                <Label>Preferred Sources</Label>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((domain) => (
                    <Badge
                      key={domain.value}
                      variant={selectedDomains.includes(domain.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDomain(domain.value)}
                    >
                      {domain.label}
                      {selectedDomains.includes(domain.value) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to search all sources
                </p>
              </div>

              {/* Context */}
              <div className="space-y-2">
                <Label htmlFor="context">Additional Context</Label>
                <Input
                  id="context"
                  placeholder="e.g., Focus on automotive industry suppliers"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add industry or company context to refine results
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {renderBeforeSubmit}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !queryText.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Intelligence
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function getPlaceholder(queryType: QueryType): string {
  const placeholders: Record<QueryType, string> = {
    supplier: "e.g., Recent news about TechCorp Inc financial health and operations",
    commodity: "e.g., Steel price trends Q1 2026, supply constraints, outlook",
    industry: "e.g., Cloud infrastructure pricing trends, AWS vs Azure vs GCP",
    regulatory: "e.g., EU CBAM carbon border adjustments impact on importers",
    "m&a": "e.g., Recent acquisitions in logistics sector, impact on capacity",
    risk: "e.g., Port congestion reports, labor strikes affecting manufacturing",
  };
  return placeholders[queryType];
}

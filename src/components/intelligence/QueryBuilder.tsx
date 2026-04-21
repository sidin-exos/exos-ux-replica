import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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

// Glass-Quadrant palette: pale icon chips, soft borders, lift on hover.
// Three category accents rotate across the six tiles to echo the dashboard system.
const TYPE_TONES: Record<string, {
  border: string;
  hoverBorder: string;
  hoverBg: string;
  hoverShadow: string;
  selectedBg: string;
  selectedRing: string;
  chipBg: string;
  iconText: string;
  eyebrow: string;
  eyebrowText: string;
}> = {
  supplier:   { border: "border-teal/30",   hoverBorder: "hover:border-teal/50",   hoverBg: "hover:bg-teal/5",   hoverShadow: "hover:shadow-teal/10",   selectedBg: "bg-teal/10",   selectedRing: "ring-teal/40",   chipBg: "bg-teal/15",   iconText: "text-teal",   eyebrow: "Supply",  eyebrowText: "text-teal" },
  commodity:  { border: "border-copper/30", hoverBorder: "hover:border-copper/50", hoverBg: "hover:bg-copper/5", hoverShadow: "hover:shadow-copper/10", selectedBg: "bg-copper/10", selectedRing: "ring-copper/40", chipBg: "bg-copper/15", iconText: "text-copper", eyebrow: "Markets", eyebrowText: "text-copper" },
  industry:   { border: "border-iris/30",   hoverBorder: "hover:border-iris/50",   hoverBg: "hover:bg-iris/5",   hoverShadow: "hover:shadow-iris/10",   selectedBg: "bg-iris/10",   selectedRing: "ring-iris/40",   chipBg: "bg-iris/15",   iconText: "text-iris",   eyebrow: "Trends",  eyebrowText: "text-iris" },
  regulatory: { border: "border-teal/30",   hoverBorder: "hover:border-teal/50",   hoverBg: "hover:bg-teal/5",   hoverShadow: "hover:shadow-teal/10",   selectedBg: "bg-teal/10",   selectedRing: "ring-teal/40",   chipBg: "bg-teal/15",   iconText: "text-teal",   eyebrow: "Policy",  eyebrowText: "text-teal" },
  "m&a":      { border: "border-copper/30", hoverBorder: "hover:border-copper/50", hoverBg: "hover:bg-copper/5", hoverShadow: "hover:shadow-copper/10", selectedBg: "bg-copper/10", selectedRing: "ring-copper/40", chipBg: "bg-copper/15", iconText: "text-copper", eyebrow: "Deals",   eyebrowText: "text-copper" },
  risk:       { border: "border-iris/30",   hoverBorder: "hover:border-iris/50",   hoverBg: "hover:bg-iris/5",   hoverShadow: "hover:shadow-iris/10",   selectedBg: "bg-iris/10",   selectedRing: "ring-iris/40",   chipBg: "bg-iris/15",   iconText: "text-iris",   eyebrow: "Risk",    eyebrowText: "text-iris" },
};

interface QueryBuilderProps {
  onSubmit: (params: IntelQueryParams) => void;
  isLoading: boolean;
  renderBeforeSubmit?: React.ReactNode;
}

export function QueryBuilder({ onSubmit, isLoading, renderBeforeSubmit }: QueryBuilderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-backed filter state
  const queryType = (searchParams.get('type') as QueryType) ?? "supplier";
  const recencyFilter = searchParams.get('recency') ?? "__none__";
  const selectedDomains = (() => {
    const raw = searchParams.get('domains');
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  })();

  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  };

  // Local-only state (not persisted in URL)
  const [queryName, setQueryName] = useState("");
  const [queryText, setQueryText] = useState("");
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
    const next = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain];
    updateFilter('domains', next.join(','));
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(QUERY_TYPE_LABELS) as [QueryType, typeof QUERY_TYPE_LABELS[QueryType]][]).map(([type, info]) => {
                const Icon = ICONS[info.icon];
                const isSelected = queryType === type;
                const tone = TYPE_TONES[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFilter('type', type === 'supplier' ? '' : type)}
                    className={`text-left rounded-xl p-4 bg-card/70 backdrop-blur-md border ${tone.border} ${tone.hoverBorder} ${tone.hoverBg} ${tone.hoverShadow} hover:-translate-y-0.5 hover:shadow-lg shadow-sm transition-all duration-200 ${
                      isSelected ? `${tone.selectedBg} ring-2 ${tone.selectedRing}` : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`size-8 rounded-lg ${tone.chipBg} flex items-center justify-center shrink-0`}>
                        {Icon && <Icon className={`w-4 h-4 ${tone.iconText}`} />}
                      </div>
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${tone.eyebrowText}`}>
                        {tone.eyebrow}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">{info.label}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Name */}
          <div className="space-y-2">
            <Label htmlFor="queryName">Report Title</Label>
            <Input
              id="queryName"
              placeholder="e.g., Q2 Supplier Risk Assessment"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This name will appear as the header in the generated report
            </p>
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
              onValueChange={(v) => updateFilter('recency', v === '__none__' ? '' : v)}
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

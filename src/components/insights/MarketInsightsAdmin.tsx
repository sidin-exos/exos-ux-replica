import { useState, useMemo } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { format } from "date-fns";
import { RefreshCw, Database, Clock, DollarSign, CheckCircle2, XCircle, Loader2, Globe, Search, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAllMarketInsights, useGenerateMarketInsights } from "@/hooks/useMarketInsights";

const INDUSTRIES = [
  { slug: "aerospace-defense", name: "Aerospace & Defense" },
  { slug: "automotive-oem", name: "Automotive (OEM)" },
  { slug: "banking-finance", name: "Banking & Finance" },
  { slug: "chemicals", name: "Chemicals" },
  { slug: "construction-infra", name: "Construction & Infra" },
  { slug: "data-centers", name: "Data Centers" },
  { slug: "e-commerce", name: "E-commerce" },
  { slug: "electronics", name: "Electronics" },
  { slug: "energy-utilities", name: "Energy & Utilities" },
  { slug: "fashion", name: "Fashion" },
  { slug: "fmcg-cpg", name: "FMCG (CPG)" },
  { slug: "food-beverage", name: "Food & Beverage" },
  { slug: "healthcare", name: "Healthcare" },
  { slug: "hospitality", name: "Hospitality" },
  { slug: "industrial-manufacturing", name: "Industrial Manufacturing" },
  { slug: "logistics-3pl", name: "Logistics & 3PL" },
  { slug: "medical-devices", name: "Medical Devices" },
  { slug: "mining-metals", name: "Mining & Metals" },
  { slug: "oil-gas-upstream", name: "Oil & Gas (Upstream)" },
  { slug: "pharma-life-sciences", name: "Pharma & Life Sciences" },
  { slug: "professional-services", name: "Professional Services" },
  { slug: "retail", name: "Retail" },
  { slug: "saas-enterprise", name: "SaaS (Enterprise)" },
  { slug: "sea-logistics", name: "Sea Logistics" },
  { slug: "telecom", name: "Telecom" },
];

const CATEGORIES = [
  { slug: "chemicals-specialty", name: "Chemicals (Specialty)" },
  { slug: "construction-materials", name: "Construction Materials" },
  { slug: "electronic-components", name: "Electronic Components" },
  { slug: "facilities-management", name: "Facilities Management" },
  { slug: "fleet-management", name: "Fleet Management" },
  { slug: "food-ingredients", name: "Food Ingredients" },
  { slug: "hr-recruitment", name: "HR & Recruitment" },
  { slug: "it-hardware", name: "IT Hardware" },
  { slug: "it-software-saas", name: "IT Software (SaaS)" },
  { slug: "lab-supplies", name: "Lab Supplies" },
  { slug: "logistics-sea-freight", name: "Logistics (Sea Freight)" },
  { slug: "logistics-small-parcel", name: "Logistics (Small Parcel)" },
  { slug: "mro-maintenance", name: "MRO (Maintenance)" },
  { slug: "packaging-primary", name: "Packaging (Primary)" },
  { slug: "plastics-resins", name: "Plastics/Resins" },
  { slug: "raw-materials-steel", name: "Raw Materials (Steel)" },
  { slug: "semiconductors", name: "Semiconductors" },
  { slug: "telecomm-equipment", name: "Telecomm Equipment" },
  { slug: "textile-fabrics", name: "Textile/Fabrics" },
  { slug: "warehouse-services", name: "Warehouse Services" },
];

const COUNTRIES = [
  // Global & macro regions
  { slug: "global", name: "Global", group: "Global & Macro Regions" },
  { slug: "eu", name: "European Union", group: "Global & Macro Regions" },
  { slug: "apac", name: "Asia-Pacific (APAC)", group: "Global & Macro Regions" },
  { slug: "north-america", name: "North America", group: "Global & Macro Regions" },
  { slug: "latam", name: "Latin America (LATAM)", group: "Global & Macro Regions" },
  { slug: "mena", name: "Middle East & North Africa (MENA)", group: "Global & Macro Regions" },
  { slug: "sub-saharan-africa", name: "Sub-Saharan Africa", group: "Global & Macro Regions" },
  // European sub-regions
  { slug: "dach", name: "DACH (DE, AT, CH)", group: "European Sub-regions" },
  { slug: "southern-europe", name: "Southern Europe (IT, ES, PT, GR)", group: "European Sub-regions" },
  { slug: "nordics", name: "Nordics (SE, NO, DK, FI)", group: "European Sub-regions" },
  { slug: "benelux", name: "Benelux (BE, NL, LU)", group: "European Sub-regions" },
  { slug: "cee", name: "Central & Eastern Europe", group: "European Sub-regions" },
  { slug: "baltics", name: "Baltics (EE, LV, LT)", group: "European Sub-regions" },
  // European countries
  { slug: "de", name: "Germany", group: "Europe" },
  { slug: "fr", name: "France", group: "Europe" },
  { slug: "uk", name: "United Kingdom", group: "Europe" },
  { slug: "it", name: "Italy", group: "Europe" },
  { slug: "es", name: "Spain", group: "Europe" },
  { slug: "nl", name: "Netherlands", group: "Europe" },
  { slug: "be", name: "Belgium", group: "Europe" },
  { slug: "at", name: "Austria", group: "Europe" },
  { slug: "ch", name: "Switzerland", group: "Europe" },
  { slug: "se", name: "Sweden", group: "Europe" },
  { slug: "no", name: "Norway", group: "Europe" },
  { slug: "dk", name: "Denmark", group: "Europe" },
  { slug: "fi", name: "Finland", group: "Europe" },
  { slug: "pl", name: "Poland", group: "Europe" },
  { slug: "cz", name: "Czech Republic", group: "Europe" },
  { slug: "pt", name: "Portugal", group: "Europe" },
  { slug: "ie", name: "Ireland", group: "Europe" },
  { slug: "gr", name: "Greece", group: "Europe" },
  { slug: "ro", name: "Romania", group: "Europe" },
  { slug: "hu", name: "Hungary", group: "Europe" },
  { slug: "sk", name: "Slovakia", group: "Europe" },
  { slug: "bg", name: "Bulgaria", group: "Europe" },
  { slug: "hr", name: "Croatia", group: "Europe" },
  { slug: "si", name: "Slovenia", group: "Europe" },
  { slug: "lt", name: "Lithuania", group: "Europe" },
  { slug: "lv", name: "Latvia", group: "Europe" },
  { slug: "ee", name: "Estonia", group: "Europe" },
  { slug: "lu", name: "Luxembourg", group: "Europe" },
  { slug: "cy", name: "Cyprus", group: "Europe" },
  { slug: "mt", name: "Malta", group: "Europe" },
  // Americas (top 10)
  { slug: "us", name: "United States", group: "Americas" },
  { slug: "ca", name: "Canada", group: "Americas" },
  { slug: "mx", name: "Mexico", group: "Americas" },
  { slug: "br", name: "Brazil", group: "Americas" },
  { slug: "ar", name: "Argentina", group: "Americas" },
  { slug: "co", name: "Colombia", group: "Americas" },
  { slug: "cl", name: "Chile", group: "Americas" },
  { slug: "pe", name: "Peru", group: "Americas" },
  { slug: "ec", name: "Ecuador", group: "Americas" },
  { slug: "ve", name: "Venezuela", group: "Americas" },
  // Asia-Pacific (top 10)
  { slug: "cn", name: "China", group: "Asia-Pacific" },
  { slug: "jp", name: "Japan", group: "Asia-Pacific" },
  { slug: "kr", name: "South Korea", group: "Asia-Pacific" },
  { slug: "in", name: "India", group: "Asia-Pacific" },
  { slug: "au", name: "Australia", group: "Asia-Pacific" },
  { slug: "sg", name: "Singapore", group: "Asia-Pacific" },
  { slug: "tw", name: "Taiwan", group: "Asia-Pacific" },
  { slug: "id", name: "Indonesia", group: "Asia-Pacific" },
  { slug: "th", name: "Thailand", group: "Asia-Pacific" },
  { slug: "vn", name: "Vietnam", group: "Asia-Pacific" },
  // MENA (top 10)
  { slug: "ae", name: "UAE", group: "Middle East & Africa" },
  { slug: "sa", name: "Saudi Arabia", group: "Middle East & Africa" },
  { slug: "il", name: "Israel", group: "Middle East & Africa" },
  { slug: "eg", name: "Egypt", group: "Middle East & Africa" },
  { slug: "tr", name: "Turkey", group: "Middle East & Africa" },
  { slug: "qa", name: "Qatar", group: "Middle East & Africa" },
  { slug: "ng", name: "Nigeria", group: "Middle East & Africa" },
  { slug: "za", name: "South Africa", group: "Middle East & Africa" },
  { slug: "ke", name: "Kenya", group: "Middle East & Africa" },
  { slug: "ma", name: "Morocco", group: "Middle East & Africa" },
];

// Map regions/sub-regions to their member countries for auto-deselection
const REGION_MEMBERS: Record<string, string[]> = {
  "eu": ["de", "fr", "it", "es", "nl", "be", "at", "se", "dk", "fi", "pl", "cz", "pt", "ie", "gr", "ro", "hu", "sk", "bg", "hr", "si", "lt", "lv", "ee", "lu", "cy", "mt"],
  "dach": ["de", "at", "ch"],
  "southern-europe": ["it", "es", "pt", "gr"],
  "nordics": ["se", "no", "dk", "fi"],
  "benelux": ["be", "nl", "lu"],
  "cee": ["pl", "cz", "ro", "hu", "sk", "bg", "hr", "si"],
  "baltics": ["ee", "lv", "lt"],
  "apac": ["cn", "jp", "kr", "in", "au", "sg", "tw", "id", "th", "vn"],
  "north-america": ["us", "ca", "mx"],
  "latam": ["br", "ar", "co", "cl", "pe", "ec", "ve", "mx"],
  "mena": ["ae", "sa", "il", "eg", "tr", "qa", "ma"],
  "sub-saharan-africa": ["ng", "za", "ke"],
};

const COUNTRY_TO_REGIONS: Record<string, string[]> = {};
Object.entries(REGION_MEMBERS).forEach(([region, members]) => {
  members.forEach(country => {
    if (!COUNTRY_TO_REGIONS[country]) COUNTRY_TO_REGIONS[country] = [];
    COUNTRY_TO_REGIONS[country].push(region);
  });
});

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
    </TableRow>
  );
}

export function MarketInsightsAdmin() {
  const { isSuperAdmin } = useAdminAuth();
  const { toast } = useToast();
  const { data: insights, isLoading: isLoadingInsights, refetch } = useAllMarketInsights();
  const { generate, isGenerating, generationResult } = useGenerateMarketInsights();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentItem: string } | null>(null);

  // Browse filters
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  // Generation form
  const [genIndustry, setGenIndustry] = useState<string>("");
  const [genCategories, setGenCategories] = useState<string[]>([]);
  const [genCountries, setGenCountries] = useState<string[]>([]);

  const filteredInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => {
      if (filterIndustry !== "all" && i.industry_slug !== filterIndustry) return false;
      if (filterCategory !== "all" && i.category_slug !== filterCategory) return false;
      if (filterCountry !== "all" && (i as any).country_slug !== filterCountry) return false;
      return true;
    });
  }, [insights, filterIndustry, filterCategory, filterCountry]);

  const toggleCategory = (slug: string) => {
    setGenCategories(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const toggleCountry = (slug: string) => {
    setGenCountries(prev => {
      if (prev.includes(slug)) {
        // Unchecking — just remove
        return prev.filter(s => s !== slug);
      }
      // Checking a region → remove its member countries
      const members = REGION_MEMBERS[slug];
      if (members) {
        return [...prev.filter(s => !members.includes(s)), slug];
      }
      // Checking a country → remove any parent region that covers it
      const parentRegions = COUNTRY_TO_REGIONS[slug] || [];
      return [...prev.filter(s => !parentRegions.includes(s)), slug];
    });
  };

  const handleGenerate = async () => {
    if (!genIndustry || genCategories.length === 0 || genCountries.length === 0) {
      toast({ title: "Missing selections", description: "Please select an industry, at least one category, and at least one country.", variant: "destructive" });
      return;
    }

    const industry = INDUSTRIES.find(i => i.slug === genIndustry);
    if (!industry) return;

    const combinations = genCountries.flatMap(countrySlug => {
      const country = COUNTRIES.find(c => c.slug === countrySlug);
      return genCategories.map(catSlug => {
        const category = CATEGORIES.find(c => c.slug === catSlug);
        return {
          industrySlug: industry.slug,
          industryName: industry.name,
          categorySlug: catSlug,
          categoryName: category?.name || catSlug,
          geography: country?.name || countrySlug,
        };
      });
    });

    const total = combinations.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      setBatchProgress({
        current: i + 1,
        total,
        currentItem: `${combo.industryName} × ${combo.categoryName} (${combo.geography})`,
      });

      try {
        await generate([combo]);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setBatchProgress(null);
    toast({
      title: "Generation Complete",
      description: `Generated ${successCount} insights. ${failCount > 0 ? `${failCount} failed.` : ""}`,
    });
    refetch();
  };

  const countryGroups = useMemo(() => {
    const groups: Record<string, typeof COUNTRIES> = {};
    COUNTRIES.forEach(c => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, []);

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Market Insights Knowledge Base
          </CardTitle>
          <CardDescription>
            Market Insights improve your scenario analysis results. Pick the country and industry you want to analyse, then upload the latest Market Insights into the system.
            <br />
            Market Insights contain publicly available information, no sensitive information is used. You can pick existing market insights from the system database if they fit your needs.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Generate New Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Market Insights
          </CardTitle>
          <CardDescription>
            Select one industry, then choose countries and categories to generate insights for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Industry (single select) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Industry</Label>
            <Select value={genIndustry} onValueChange={setGenIndustry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(i => (
                  <SelectItem key={i.slug} value={i.slug}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Countries (multi-select with groups) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Countries & Regions
                {genCountries.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">{genCountries.length} selected</Badge>
                )}
              </Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-3">
                {Object.entries(countryGroups).map(([group, countries]) => (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{group}</p>
                    <div className="space-y-1.5">
                      {countries.map(c => (
                        <label key={c.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                          <Checkbox
                            checked={genCountries.includes(c.slug)}
                            onCheckedChange={() => toggleCountry(c.slug)}
                          />
                          <span className="text-xs">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories (multi-select) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Procurement Categories
                {genCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">{genCategories.length} selected</Badge>
                )}
              </Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-1.5">
                {CATEGORIES.map(c => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={genCategories.includes(c.slug)}
                      onCheckedChange={() => toggleCategory(c.slug)}
                    />
                    <span className="text-xs">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary + Generate button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {genIndustry && genCategories.length > 0 && genCountries.length > 0
                ? `${genCountries.length} × ${genCategories.length} = ${genCountries.length * genCategories.length} insight(s) will be generated`
                : "Select industry, countries, and categories to generate"}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || batchProgress !== null || !genIndustry || genCategories.length === 0 || genCountries.length === 0}
            >
              {isGenerating || batchProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : "Generating..."}
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Generate Market Insights
                </>
              )}
            </Button>
          </div>

          {batchProgress && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-xs">{batchProgress.currentItem}</span>
                <span className="text-xs">{batchProgress.current} of {batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} />
            </div>
          )}

          {generationResult && (
            <div className={`p-4 rounded-lg ${generationResult.success ? 'bg-primary/5 border border-primary/20' : 'bg-destructive/10 border border-destructive/20'}`}>
              {generationResult.success && generationResult.summary ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium text-sm">Generation Complete</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{generationResult.summary.successful}/{generationResult.summary.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{(generationResult.summary.processingTimeMs / 1000).toFixed(1)}s</span>
                    </div>
                    {isSuperAdmin && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Tokens:</span>
                          <span>{generationResult.summary.totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{generationResult.summary.estimatedCost}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>{generationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse Existing Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Market Insights</CardTitle>
          <CardDescription>
            {filteredInsights.length} of {insights?.length || 0} insights shown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Filters:</span>
            </div>
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRIES.map(i => (
                  <SelectItem key={i.slug} value={i.slug}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map(c => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoadingInsights ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </TableBody>
            </Table>
          ) : filteredInsights.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell className="font-medium text-xs">{insight.industry_name}</TableCell>
                    <TableCell className="text-xs">{insight.category_name}</TableCell>
                    <TableCell className="text-xs">{(insight as any).country_name || "EU"}</TableCell>
                    <TableCell>
                      <Badge variant={insight.confidence_score >= 0.7 ? "default" : "secondary"} className="text-[10px]">
                        {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(insight.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">No market insights found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {insights && insights.length > 0
                  ? "No insights match the current filters. Try adjusting your selection."
                  : "Generate your first batch of AI-powered market insights using the form above."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

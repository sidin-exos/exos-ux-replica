import { useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Database, Clock, DollarSign, CheckCircle2, XCircle, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAllMarketInsights, useGenerateMarketInsights } from "@/hooks/useMarketInsights";

// Existing 5 combinations (already generated)
const EXISTING_COMBINATIONS = [
  { industrySlug: "pharma-life-sciences", categorySlug: "lab-supplies" },
  { industrySlug: "automotive-oem", categorySlug: "raw-materials-steel" },
  { industrySlug: "retail", categorySlug: "logistics-small-parcel" },
  { industrySlug: "saas-enterprise", categorySlug: "it-software-saas" },
  { industrySlug: "healthcare", categorySlug: "mro-maintenance" },
];

const EU_COMBINATIONS = [
  { industrySlug: "aerospace-defense", industryName: "Aerospace & Defense", categorySlug: "semiconductors", categoryName: "Semiconductors", geography: "Global" },
  { industrySlug: "electronics", industryName: "Electronics", categorySlug: "electronic-components", categoryName: "Electronic Components", geography: "EU" },
  { industrySlug: "food-beverage", industryName: "Food & Beverage", categorySlug: "food-ingredients", categoryName: "Food Ingredients", geography: "EU" },
  { industrySlug: "fmcg-cpg", industryName: "FMCG (CPG)", categorySlug: "packaging-primary", categoryName: "Packaging (Primary)", geography: "EU" },
  { industrySlug: "chemicals", industryName: "Chemicals", categorySlug: "plastics-resins", categoryName: "Plastics/Resins", geography: "EU" },
  { industrySlug: "construction-infra", industryName: "Construction & Infra", categorySlug: "construction-materials", categoryName: "Construction Materials", geography: "EU" },
  { industrySlug: "data-centers", industryName: "Data Centers", categorySlug: "it-hardware", categoryName: "IT Hardware", geography: "EU" },
  { industrySlug: "e-commerce", industryName: "E-commerce", categorySlug: "warehouse-services", categoryName: "Warehouse Services", geography: "EU" },
  { industrySlug: "energy-utilities", industryName: "Energy & Utilities", categorySlug: "mro-maintenance", categoryName: "MRO (Maintenance)", geography: "EU" },
  { industrySlug: "fashion", industryName: "Fashion", categorySlug: "textile-fabrics", categoryName: "Textile/Fabrics", geography: "EU" },
  { industrySlug: "industrial-manufacturing", industryName: "Industrial Manufacturing", categorySlug: "raw-materials-steel", categoryName: "Raw Materials (Steel)", geography: "EU" },
  { industrySlug: "logistics-3pl", industryName: "Logistics & 3PL", categorySlug: "fleet-management", categoryName: "Fleet Management", geography: "EU" },
  { industrySlug: "medical-devices", industryName: "Medical Devices", categorySlug: "electronic-components", categoryName: "Electronic Components", geography: "EU" },
  { industrySlug: "mining-metals", industryName: "Mining & Metals", categorySlug: "mro-maintenance", categoryName: "MRO (Maintenance)", geography: "EU" },
  { industrySlug: "oil-gas-upstream", industryName: "Oil & Gas (Upstream)", categorySlug: "facilities-management", categoryName: "Facilities Management", geography: "EU" },
  { industrySlug: "banking-finance", industryName: "Banking & Finance", categorySlug: "it-software-saas", categoryName: "IT Software (SaaS)", geography: "EU" },
  { industrySlug: "professional-services", industryName: "Professional Services", categorySlug: "hr-recruitment", categoryName: "HR & Recruitment", geography: "EU" },
  { industrySlug: "telecom", industryName: "Telecom", categorySlug: "telecomm-equipment", categoryName: "Telecomm Equipment", geography: "EU" },
  { industrySlug: "hospitality", industryName: "Hospitality", categorySlug: "facilities-management", categoryName: "Facilities Management", geography: "EU" },
  { industrySlug: "sea-logistics", industryName: "Sea Logistics", categorySlug: "logistics-sea-freight", categoryName: "Logistics (Sea Freight)", geography: "EU" },
];

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
    </TableRow>
  );
}

export function MarketInsightsAdmin() {
  const { toast } = useToast();
  const { data: insights, isLoading: isLoadingInsights, refetch } = useAllMarketInsights();
  const { generate, isGenerating, generationResult } = useGenerateMarketInsights();
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentItem: string } | null>(null);

  const handleGenerateBatch = async (combinations: typeof EU_COMBINATIONS) => {
    const total = combinations.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      setBatchProgress({
        current: i + 1,
        total,
        currentItem: `${combo.industryName} + ${combo.categoryName}`,
      });

      try {
        await generate([combo]);
        successCount++;
      } catch (error) {
        console.error(`Failed to generate ${combo.industrySlug}+${combo.categorySlug}:`, error);
        failCount++;
      }
    }

    setBatchProgress(null);
    toast({
      title: "Batch Generation Complete",
      description: `Generated ${successCount} insights. ${failCount > 0 ? `${failCount} failed.` : ""}`,
    });
    refetch();
  };

  const handleGenerateEUBatch = () => {
    handleGenerateBatch(EU_COMBINATIONS);
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Market Insights Knowledge Base
          </CardTitle>
          <CardDescription>
            Market Insights improve your scenario analysis results. Pick the country and industry you want to analyse, then upload the latest Market Insights into the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGenerateEUBatch}
              disabled={isGenerating || batchProgress !== null}
            >
              {isGenerating || batchProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : "Generating..."}
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Generate 20 EU Market Insights
                </>
              )}
            </Button>
            <div className="flex-1 text-sm text-muted-foreground">
              <p>Generates EU-focused insights for 20 industry+category combinations.</p>
              
            </div>
          </div>

          {batchProgress && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{batchProgress.currentItem}</span>
                <span>{batchProgress.current} of {batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} />
            </div>
          )}

          {generationResult && (
            <div className={`p-4 rounded-lg ${generationResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
              {generationResult.success && generationResult.summary ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Generation Complete</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span>{generationResult.summary.successful}/{generationResult.summary.total} successful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{(generationResult.summary.processingTimeMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tokens:</span>
                      <span>{generationResult.summary.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{generationResult.summary.estimatedCost}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>{generationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Market Insights</CardTitle>
          <CardDescription>
            {insights?.length || 0} insights available in the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Citations</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </TableBody>
            </Table>
          ) : insights && insights.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Citations</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell className="font-medium">{insight.industry_name}</TableCell>
                    <TableCell>{insight.category_name}</TableCell>
                    <TableCell>
                      <Badge variant={insight.confidence_score >= 0.7 ? "default" : "secondary"}>
                        {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{insight.citations.length} sources</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(insight.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No market insights yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Generate your first batch of AI-powered market insights using the button above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Copy,
  Building2, 
  TrendingUp, 
  BarChart3, 
  Scale, 
  GitMerge, 
  AlertTriangle,
  RefreshCw,
  Coins,
  Database
} from "lucide-react";
import { type IntelResult, QUERY_TYPE_LABELS } from "@/hooks/useMarketIntelligence";
import { SaveToKnowledgeBaseDialog } from "@/components/intelligence/SaveToKnowledgeBaseDialog";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { toast } from "sonner";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  TrendingUp,
  BarChart3,
  Scale,
  GitMerge,
  AlertTriangle,
};

interface IntelResultsProps {
  result: IntelResult;
  onNewQuery: () => void;
}

export function IntelResults({ result, onNewQuery }: IntelResultsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const typeInfo = QUERY_TYPE_LABELS[result.queryType];
  const IconComponent = ICONS[typeInfo.icon];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.summary);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-l-4 border-l-highlight bg-gradient-to-r from-highlight/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {IconComponent && <IconComponent className="w-5 h-5 text-highlight" />}
              <CardTitle className="text-lg">{result.queryName || `${typeInfo.label} Analysis`}</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1 border-info/50 text-info">
                <Clock className="w-3 h-3" />
                {(result.processingTimeMs / 1000).toFixed(1)}s
              </Badge>
              {result.tokenUsage && (
                <Badge variant="outline" className="gap-1 border-warning/50 text-warning">
                  <Coins className="w-3 h-3" />
                  {result.tokenUsage.totalTokens.toLocaleString()} tokens
                </Badge>
              )}
              <Badge className="gap-1 bg-highlight hover:bg-highlight/90 text-highlight-foreground">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Analysis Summary</CardTitle>
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={result.summary} className="text-sm" />
        </CardContent>
      </Card>

      {/* Citations Card */}
      {result.citations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Sources ({result.citations.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click to view original sources
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.citations.map((citation) => (
                <a
                  key={citation.index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                >
                  <Badge variant="secondary" className="shrink-0">
                    [{citation.index}]
                  </Badge>
                  <span className="text-sm text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
                    {formatUrl(citation.url)}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <Separator />
      <ReportExportButtons
        scenarioTitle={`${typeInfo.label} Analysis`}
        analysisResult={result.summary}
        formData={{}}
        timestamp={new Date().toISOString()}
      />

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="gap-2">
          <Database className="w-4 h-4" />
          Save to Knowledge Base
        </Button>
        <Button variant="outline" onClick={onNewQuery} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          New Query
        </Button>
      </div>

      <SaveToKnowledgeBaseDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        result={result}
      />
    </div>
  );
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname.length > 30 ? parsed.pathname.slice(0, 30) + '...' : parsed.pathname}`;
  } catch {
    return url.slice(0, 50) + (url.length > 50 ? '...' : '');
  }
}

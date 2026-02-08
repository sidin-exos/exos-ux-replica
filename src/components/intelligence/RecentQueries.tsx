import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Clock,
  Building2, 
  TrendingUp, 
  BarChart3, 
  Scale, 
  GitMerge, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { 
  type IntelQuery, 
  type QueryType,
  QUERY_TYPE_LABELS 
} from "@/hooks/useMarketIntelligence";
import { formatDistanceToNow } from "date-fns";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  TrendingUp,
  BarChart3,
  Scale,
  GitMerge,
  AlertTriangle,
};

interface RecentQueriesProps {
  queries: IntelQuery[];
  isLoading: boolean;
  onLoad: () => void;
}

export function RecentQueries({ queries, isLoading, onLoad }: RecentQueriesProps) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    onLoad();
    setHasLoaded(true);
  }, [onLoad]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Queries
          </CardTitle>
          {hasLoaded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleLoad}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
        <CardDescription>
          Your intelligence search history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasLoaded ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              Click below to load your query history.
            </p>
            <Button variant="outline" size="sm" onClick={handleLoad}>
              Load Recent History
            </Button>
          </div>
        ) : queries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No queries found. Start by searching above.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {queries.map((query) => {
                const typeInfo = QUERY_TYPE_LABELS[query.query_type as QueryType];
                const IconComponent = typeInfo ? ICONS[typeInfo.icon] : null;

                return (
                  <div
                    key={query.id}
                    className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {query.query_text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {typeInfo?.label || query.query_type}
                      </Badge>
                      {query.recency_filter && (
                        <Badge variant="outline" className="text-xs">
                          {query.recency_filter}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

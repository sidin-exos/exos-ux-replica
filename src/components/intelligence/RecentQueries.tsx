import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  Clock,
  Building2, 
  TrendingUp, 
  BarChart3, 
  Scale, 
  GitMerge, 
  AlertTriangle,
  RefreshCw,
  Search
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

function QueryRowSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-start gap-2 mb-2">
        <Skeleton className="w-4 h-4 shrink-0 mt-0.5 rounded" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function RecentQueries({ queries, isLoading, onLoad }: RecentQueriesProps) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    onLoad();
    setHasLoaded(true);
  }, [onLoad]);

  // Auto-refresh once history is loaded:
  // - every 24h on a timer (covers long-lived sessions)
  // - whenever the tab regains focus / becomes visible (covers users
  //   coming back after scheduled reports have run in the background)
  useEffect(() => {
    if (!hasLoaded) return;

    const DAY_MS = 24 * 60 * 60 * 1000;
    const interval = window.setInterval(() => {
      onLoad();
    }, DAY_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        onLoad();
      }
    };
    const handleFocus = () => onLoad();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [hasLoaded, onLoad]);

  return (
    <Card className="h-full border-t-4 border-t-violet-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-iris" />
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
          <div className="space-y-3">
            <QueryRowSkeleton />
            <QueryRowSkeleton />
            <QueryRowSkeleton />
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No queries yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Run your first intelligence search above to see your history here.
            </p>
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

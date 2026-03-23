import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useMethodologyChangeLog } from "@/hooks/useMethodologyAdmin";
import type { ChangeLogEntry } from "@/hooks/useMethodologyAdmin";

const PAGE_SIZE = 20;

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function operationBadgeVariant(op: string): "default" | "secondary" | "destructive" | "outline" {
  switch (op) {
    case "INSERT":
      return "default";
    case "DELETE":
      return "destructive";
    default:
      return "secondary";
  }
}

function getChangedFields(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  if (!oldData || !newData) return null;
  const changed: { field: string; oldVal: unknown; newVal: unknown }[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push({ field: key, oldVal: oldData[key], newVal: newData[key] });
    }
  }
  return changed.length > 0 ? changed : null;
}

function DiffView({ entry }: { entry: ChangeLogEntry }) {
  const oldData = entry.old_data as Record<string, unknown> | null;
  const newData = entry.new_data as Record<string, unknown> | null;
  const changed = getChangedFields(oldData, newData);

  if (changed) {
    return (
      <div className="space-y-3">
        {changed.map(({ field, oldVal, newVal }) => (
          <div key={field} className="text-sm">
            <p className="font-medium text-muted-foreground mb-1">{field}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-2">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Before</p>
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {typeof oldVal === "string" ? oldVal : JSON.stringify(oldVal, null, 2)}
                </pre>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md p-2">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">After</p>
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {typeof newVal === "string" ? newVal : JSON.stringify(newVal, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {oldData && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Old Data</p>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(oldData, null, 2)}
          </pre>
        </div>
      )}
      {newData && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">New Data</p>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(newData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const MethodologyHistory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useMethodologyChangeLog(page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container max-w-6xl py-12 space-y-8">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer hover:text-slate-600" onClick={() => navigate("/admin/methodology")}>
                Methodology
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-600">Change History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Change History</h1>
          <p className="text-slate-500 mt-1">
            All methodology edits are automatically logged. Click a row to view the diff.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <>
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {relativeTime(entry.changed_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {entry.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono max-w-[200px] truncate">
                        {entry.record_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={operationBadgeVariant(entry.operation)}>
                          {entry.operation}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {entry.change_summary ?? "—"}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${entry.id}-diff`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <DiffView entry={entry} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {data?.entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No changes recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MethodologyHistory;

import { useMemo } from "react";
import { PlusCircle, AlertTriangle, CheckCircle, XCircle, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTestPrompts } from "@/hooks/useTestDatabase";
import type { FieldAction } from "@/lib/testing/types";
import TestStatsCards from "./TestStatsCards";

interface FieldAggregation {
  field_name: string;
  counts: Record<FieldAction, number>;
  total: number;
  dominant: FieldAction;
  dominantPct: number;
}

interface SchemaGapItem {
  suggested_field: string;
  reason: string;
  frequency: number;
  persona_source: string;
}

const ACTION_COLORS: Record<FieldAction, string> = {
  REDUNDANT_HIDE: "bg-green-500/15 text-green-700 border-green-500/30",
  OPTIONAL_KEEP: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  CRITICAL_REQUIRE: "bg-red-500/15 text-red-700 border-red-500/30",
  SCHEMA_GAP_DETECTED: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

const ACTION_LABELS: Record<FieldAction, string> = {
  REDUNDANT_HIDE: "Redundant — Hide",
  OPTIONAL_KEEP: "Optional — Keep",
  CRITICAL_REQUIRE: "Critical — Require",
  SCHEMA_GAP_DETECTED: "Schema Gap",
};

/**
 * Parse shadow_log JSONB to extract field evaluations.
 * Expected shape: { field_evaluations: [{ field_name, action, ... }], schema_gaps: [...] }
 */
function extractEvaluations(shadowLog: Record<string, unknown> | null) {
  if (!shadowLog) return { fields: [] as { field_name: string; action: FieldAction }[], gaps: [] as SchemaGapItem[] };

  const fieldEvals = Array.isArray(shadowLog.field_evaluations)
    ? (shadowLog.field_evaluations as { field_name?: string; action?: string }[])
        .filter((f) => f.field_name && f.action)
        .map((f) => ({ field_name: f.field_name!, action: f.action as FieldAction }))
    : [];

  const gaps = Array.isArray(shadowLog.schema_gaps)
    ? (shadowLog.schema_gaps as SchemaGapItem[])
    : [];

  return { fields: fieldEvals, gaps };
}

const RefactoringBacklog = () => {
  const { data: prompts, isLoading } = useTestPrompts(100);

  const { fieldAggregations, schemaGaps } = useMemo(() => {
    if (!prompts) return { fieldAggregations: [] as FieldAggregation[], schemaGaps: [] as SchemaGapItem[] };

    const fieldMap = new Map<string, Record<FieldAction, number>>();
    const gapMap = new Map<string, SchemaGapItem>();

    for (const prompt of prompts) {
      for (const report of prompt.test_reports) {
        const { fields, gaps } = extractEvaluations(report.shadow_log as Record<string, unknown> | null);

        for (const f of fields) {
          const existing = fieldMap.get(f.field_name) || {
            REDUNDANT_HIDE: 0,
            OPTIONAL_KEEP: 0,
            CRITICAL_REQUIRE: 0,
            SCHEMA_GAP_DETECTED: 0,
          };
          existing[f.action] = (existing[f.action] || 0) + 1;
          fieldMap.set(f.field_name, existing);
        }

        for (const g of gaps) {
          const key = g.suggested_field;
          const existing = gapMap.get(key);
          if (existing) {
            existing.frequency += 1;
          } else {
            gapMap.set(key, { ...g, frequency: 1 });
          }
        }
      }
    }

    const fieldAggregations: FieldAggregation[] = Array.from(fieldMap.entries())
      .map(([field_name, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        const dominant = (Object.entries(counts) as [FieldAction, number][])
          .sort((a, b) => b[1] - a[1])[0];
        return {
          field_name,
          counts,
          total,
          dominant: dominant[0],
          dominantPct: Math.round((dominant[1] / total) * 100),
        };
      })
      .sort((a, b) => b.dominantPct - a.dominantPct);

    const schemaGaps = Array.from(gapMap.values()).sort((a, b) => b.frequency - a.frequency);

    return { fieldAggregations, schemaGaps };
  }, [prompts]);

  return (
    <div className="space-y-6">
      <TestStatsCards />

      {/* Consensus Actions */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Consensus Actions
          </CardTitle>
          <CardDescription>
            Field-level verdicts aggregated across all test runs. Fields with &gt;80% agreement are flagged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : fieldAggregations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No field evaluations found yet.</p>
              <p className="text-xs mt-1">Launch test batches above to start collecting data.</p>
            </div>
          ) : (
            <>
              {fieldAggregations.some((f) => f.dominantPct >= 80) && (
                <Alert className="mb-4 border-primary/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Suggested Changes</AlertTitle>
                  <AlertDescription>
                    {fieldAggregations.filter((f) => f.dominantPct >= 80).length} field(s) have strong consensus (&gt;80%) for a schema change.
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Dominant Verdict</TableHead>
                    <TableHead className="text-right">Agreement</TableHead>
                    <TableHead className="text-right">Runs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldAggregations.map((f) => (
                    <TableRow key={f.field_name} className={f.dominantPct >= 80 ? "bg-primary/5" : ""}>
                      <TableCell className="font-mono text-sm">{f.field_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ACTION_COLORS[f.dominant]}>
                          {ACTION_LABELS[f.dominant]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {f.dominantPct}%
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {f.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Schema Gaps */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-500" />
            Detected Schema Gaps
          </CardTitle>
          <CardDescription>
            Fields recommended by the AI Judge that don't exist in the current schema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : schemaGaps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No schema gaps detected yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemaGaps.map((gap) => (
                <div
                  key={gap.suggested_field}
                  className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5"
                >
                  <PlusCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium">{gap.suggested_field}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{gap.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {gap.frequency}× detected
                    </Badge>
                    {gap.persona_source && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {gap.persona_source.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RefactoringBacklog;

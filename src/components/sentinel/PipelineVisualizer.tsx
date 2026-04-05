/**
 * Sentinel Pipeline Visualization Component
 * 
 * Displays the current state of the EXOS Sentinel pipeline
 * with visual indicators for each stage.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Database,
  Cloud,
  CheckCircle,
  FileOutput,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { PipelineStageResult, PipelineStage } from "@/lib/sentinel";

interface PipelineVisualizerProps {
  stages: PipelineStageResult[];
  currentStage: string | null;
  isProcessing: boolean;
  confidenceScore?: number;
}

const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; icon: typeof Shield; description: string }
> = {
  anonymization: {
    label: "Anonymization",
    icon: Shield,
    description: "Masking sensitive data",
  },
  grounding: {
    label: "Grounding",
    icon: Database,
    description: "Injecting domain context",
  },
  cloud_inference: {
    label: "AI Analysis",
    icon: Cloud,
    description: "Processing with AI",
  },
  validation: {
    label: "Validation",
    icon: CheckCircle,
    description: "Checking response integrity",
  },
  deanonymization: {
    label: "Restoration",
    icon: FileOutput,
    description: "Restoring context",
  },
};

const STAGE_ORDER: PipelineStage[] = [
  "anonymization",
  "grounding",
  "cloud_inference",
  "validation",
  "deanonymization",
];

function getStatusIcon(status: PipelineStageResult["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "skipped":
      return <span className="h-4 w-4 text-muted-foreground">—</span>;
  }
}

function getStatusBadge(status: PipelineStageResult["status"]) {
  const variants: Record<
    PipelineStageResult["status"],
    "default" | "secondary" | "destructive" | "outline"
  > = {
    success: "default",
    warning: "secondary",
    error: "destructive",
    skipped: "outline",
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
}

export function PipelineVisualizer({
  stages,
  currentStage,
  isProcessing,
  confidenceScore,
}: PipelineVisualizerProps) {
  const stageMap = new Map(stages.map((s) => [s.stage, s]));

  // Calculate progress
  const completedStages = stages.filter(
    (s) => s.status !== "skipped"
  ).length;
  const progress = isProcessing
    ? (completedStages / STAGE_ORDER.length) * 100
    : stages.length > 0
    ? 100
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            EXOS Sentinel Pipeline
          </span>
          {confidenceScore !== undefined && (
            <Badge
              variant={confidenceScore >= 0.7 ? "default" : "secondary"}
              className="text-xs"
            >
              {(confidenceScore * 100).toFixed(0)}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <Progress value={progress} className="h-2" />

        {/* Stage list */}
        <div className="space-y-2">
          {STAGE_ORDER.map((stageId) => {
            const config = STAGE_CONFIG[stageId];
            const result = stageMap.get(stageId);
            const isActive = currentStage === stageId;
            const Icon = config.icon;

            return (
              <div
                key={stageId}
                className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : result
                    ? "bg-muted/50"
                    : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : result
                        ? "bg-muted"
                        : "bg-muted/50"
                    }`}
                  >
                    {isActive && isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result && (
                    <>
                      {getStatusIcon(result.status)}
                      <span className="text-xs text-muted-foreground">
                        {result.timeMs.toFixed(0)}ms
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage details */}
        {stages.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Stage Details</p>
            <div className="space-y-1">
              {stages
                .filter((s) => s.details && Object.keys(s.details).length > 0)
                .map((stage) => (
                  <div
                    key={stage.stage}
                    className="flex items-start gap-2 text-xs"
                  >
                    {getStatusBadge(stage.status)}
                    <span className="text-muted-foreground">
                      {stage.stage}:{" "}
                      {Object.entries(stage.details || {})
                        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                        .join(", ")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * React hook for EXOS Sentinel pipeline integration
 * 
 * Provides a clean interface for using the Sentinel pipeline
 * from React components.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryContext, ProcurementCategory } from "@/lib/ai-context-templates";
import {
  preparePipelineRequest,
  completePipeline,
  getPipelineSummary,
  type OrchestratorRequest,
  type OrchestratorResponse,
  type PipelineConfig,
} from "@/lib/sentinel";

interface UseSentinelOptions {
  onProgress?: (stage: string, status: string) => void;
  onError?: (error: Error) => void;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface SentinelState {
  isProcessing: boolean;
  currentStage: string | null;
  result: OrchestratorResponse | null;
  error: Error | null;
  tokenUsage: TokenUsage | null;
  processingTimeMs: number | null;
}

export function useSentinel(options: UseSentinelOptions = {}) {
  const [state, setState] = useState<SentinelState>({
    isProcessing: false,
    currentStage: null,
    result: null,
    error: null,
    tokenUsage: null,
    processingTimeMs: null,
  });

  const analyze = useCallback(
    async (
      scenarioType: string,
      scenarioData: Record<string, string>,
      industry: IndustryContext | null,
      category: ProcurementCategory | null,
      config?: Partial<PipelineConfig>,
      model: string = "google/gemini-3-flash-preview"
    ): Promise<OrchestratorResponse | null> => {
      setState({
        isProcessing: true,
        currentStage: "anonymization",
        result: null,
        error: null,
        tokenUsage: null,
        processingTimeMs: null,
      });

      try {
        // Build the request
        // Merge config with defaults
        const mergedConfig = config ? { ...config } : undefined;

        const request: OrchestratorRequest = {
          rawInput: "",
          scenarioType,
          scenarioData,
          industrySlug: industry?.slug || null,
          categorySlug: category?.slug || null,
          config: mergedConfig,
        };

        options.onProgress?.("anonymization", "processing");
        setState((s) => ({ ...s, currentStage: "anonymization" }));

        // Execute pre-inference pipeline stages
        const { context, inferencePayload, config: pipelineConfig } =
          preparePipelineRequest(request, industry, category);

        options.onProgress?.("grounding", "processing");
        setState((s) => ({ ...s, currentStage: "grounding" }));

        // Call edge function for AI inference
        options.onProgress?.("cloud_inference", "processing");
        setState((s) => ({ ...s, currentStage: "cloud_inference" }));

        const inferenceStart = performance.now();

        // Extract metadata from stages for test logging
        const anonymizationStage = context.stages.find(s => s.stage === 'anonymization');
        const groundingStage = context.stages.find(s => s.stage === 'grounding');

        const { data, error: functionError } = await supabase.functions.invoke(
          "sentinel-analysis",
          {
            body: {
              systemPrompt: inferencePayload.systemPrompt,
              userPrompt: inferencePayload.userPrompt,
              model, // Use passed model or default
              useLocalModel: inferencePayload.useLocal,
              stream: false,
              // Testing metadata for database logging
              scenarioType,
              scenarioData,
              industrySlug: industry?.slug || null,
              categorySlug: category?.slug || null,
              groundingContext: groundingStage?.details || null,
              anonymizationMetadata: anonymizationStage?.details || null,
              enableTestLogging: true,
            },
          }
        );

        if (functionError) {
          throw new Error(functionError.message || "AI inference failed");
        }

        if (data.error) {
          throw new Error(data.error);
        }

        const inferenceTime = performance.now() - inferenceStart;

        // Update inference stage timing
        const inferenceStageIndex = context.stages.findIndex(
          (s) => s.stage === "cloud_inference"
        );
        if (inferenceStageIndex >= 0) {
          context.stages[inferenceStageIndex].timeMs = inferenceTime;
        }

        // Complete pipeline with validation and de-anonymization
        options.onProgress?.("validation", "processing");
        setState((s) => ({ ...s, currentStage: "validation" }));

        const result = completePipeline(
          context,
          data.content,
          request,
          pipelineConfig
        );

        console.log("[Sentinel]", getPipelineSummary(result));

        options.onProgress?.("complete", "success");
        setState({
          isProcessing: false,
          currentStage: null,
          result,
          error: null,
          tokenUsage: data.usage || null,
          processingTimeMs: data.processingTimeMs || null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        setState({
          isProcessing: false,
          currentStage: null,
          result: null,
          error: err,
          tokenUsage: null,
          processingTimeMs: null,
        });
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      currentStage: null,
      result: null,
      error: null,
      tokenUsage: null,
      processingTimeMs: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}

/**
 * Simplified hook for quick analysis without full pipeline tracking
 */
export function useQuickAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (prompt: string, systemPrompt?: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          "sentinel-analysis",
          {
            body: {
              systemPrompt:
                systemPrompt ||
                "You are an expert procurement analyst. Provide clear, actionable recommendations.",
              userPrompt: prompt,
              stream: false,
            },
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        return data.content;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { analyze, isLoading, error };
}

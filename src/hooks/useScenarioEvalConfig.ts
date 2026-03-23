/**
 * Fetches scenario evaluation config from DB (coaching_cards + scenario_field_config)
 * and constructs a ScenarioEvalConfig for the client-side input evaluator.
 *
 * Replaces the hardcoded SCENARIO_EVAL_CONFIGS lookup when data is available.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ScenarioEvalConfig,
  BlockConfig,
  ScenarioGroup,
  DeviationType,
} from "@/lib/input-evaluator/types";

function mapExpectedDataType(dbType: string): BlockConfig["expectedDataType"] {
  switch (dbType) {
    case "narrative":
      return "narrative";
    case "numeric":
      return "numeric";
    case "structured":
      return "mixed";
    case "document":
      return "narrative";
    default:
      return "narrative";
  }
}

function mapDeviationType(dbDev: string): DeviationType {
  if (dbDev === "1H") return "1H";
  const num = Number(dbDev);
  if (num === 0 || num === 1 || num === 2) return num as 0 | 1 | 2;
  return 0;
}

export function useScenarioEvalConfig(scenarioSlug: string | null) {
  return useQuery({
    queryKey: ["scenario-eval-config", scenarioSlug],
    queryFn: async (): Promise<ScenarioEvalConfig | null> => {
      if (!scenarioSlug) return null;

      const [coachingResult, fieldsResult] = await Promise.all([
        supabase
          .from("coaching_cards")
          .select(
            "scenario_group, financial_impact, common_failure, gdpr_guardrail"
          )
          .eq("scenario_slug", scenarioSlug)
          .single(),
        supabase
          .from("scenario_field_config")
          .select(
            "block_id, block_label, is_required, min_words, expected_data_type, expected_keywords, deviation_type"
          )
          .eq("scenario_slug", scenarioSlug)
          .order("created_at", { ascending: true }),
      ]);

      if (coachingResult.error) throw coachingResult.error;
      if (fieldsResult.error) throw fieldsResult.error;

      const coaching = coachingResult.data;
      const fields = fieldsResult.data;

      if (!coaching || !fields || fields.length === 0) return null;

      const blocks: BlockConfig[] = fields.map((f) => ({
        fieldId: f.block_id,
        label: f.block_label,
        minWords: f.min_words,
        expectedDataType: mapExpectedDataType(f.expected_data_type),
        required: f.is_required,
        expectedKeywords: f.expected_keywords ?? undefined,
      }));

      return {
        scenarioId: scenarioSlug,
        group: coaching.scenario_group as ScenarioGroup,
        deviationType: mapDeviationType(fields[0].deviation_type),
        blocks,
        scenarioChecks: [], // Logic checks stay in scenario-checks.ts
        financialImpactGap: coaching.financial_impact || undefined,
        commonFailureMode: coaching.common_failure || undefined,
        gdprGuardrail: coaching.gdpr_guardrail || undefined,
      };
    },
    enabled: !!scenarioSlug,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

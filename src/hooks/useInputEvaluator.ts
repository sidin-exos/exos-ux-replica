/**
 * INPUT_EVALUATOR — React hook
 * Wraps evaluateInputQuality with 800ms debounce.
 *
 * Architecture Board Constraint #3:
 * Uses useRef + JSON.stringify comparison to ensure stable EvaluationResult reference,
 * preventing infinite re-renders in GenericScenarioWizard and DataRequirementsAlert.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { evaluateInputQuality } from "@/lib/input-evaluator";
import type { EvaluationResult } from "@/lib/input-evaluator/types";

export function useInputEvaluator(
  scenarioId: string,
  formData: Record<string, string>,
  debounceMs = 800
): EvaluationResult | null {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const lastSerializedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Memoize the evaluation trigger to avoid effect churn
  const scheduleEval = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const evaluation = evaluateInputQuality(scenarioId, formData);
      const serialized = JSON.stringify(evaluation);

      // Constraint #3: Only update state if the result actually changed
      if (serialized !== lastSerializedRef.current) {
        lastSerializedRef.current = serialized;
        setResult(evaluation);
      }
    }, debounceMs);
  }, [scenarioId, formData, debounceMs]);

  useEffect(() => {
    scheduleEval();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleEval]);

  return result;
}



# INPUT_EVALUATOR — Phase 1 + Phase 2 Implementation

## Scope
Implement the quality-aware input evaluation system per the approved spec, with the 4 Architecture Board constraints applied.

## Files to Create (Phase 1 — this batch)

### 1. `src/lib/input-evaluator/types.ts`
Core type definitions: `EvaluationResult`, `BlockEvaluation`, `QualityCheck`, `ScenarioEvalConfig`, `CheckType`, severity levels. Uses scenario string IDs (not numbers) to match existing codebase convention.

### 2. `src/lib/input-evaluator/wordlist.ts`
Procurement domain glossary (~200 terms from spec §8) plus top 500 English stopwords/common words for gibberish detection. Exported as a `Set<string>` for O(1) lookup.

### 3. `src/lib/input-evaluator/universal-checks.ts`
5 universal checks applied to every block:
- **UNIVERSAL_GIBBERISH** — keyboard-mash patterns (`asdf`, `qwerty`, `zxcv`), repeated char sequences, dictionary-word ratio < 40%. Exempts numeric-heavy blocks.
- **UNIVERSAL_MIN_LENGTH** — 30/40/20 word thresholds per block position, with Type 1H overrides.
- **UNIVERSAL_BOILERPLATE** — detects identical content across multiple blocks.
- **UNIVERSAL_LANGUAGE** — non-Latin script detection (INFO only).
- **UNIVERSAL_PII** — regex for emails, phones, titled names. **ReDoS protection: slices input to 5000 chars before regex execution** with explicit comment per constraint #2.

### 4. `src/lib/input-evaluator/group-checks.ts`
Group-level checks for A/B/C/D/E per spec §4. Each exports a function `runGroupChecks(group, blocks, formData)` returning `QualityCheck[]`.

### 5. `src/lib/input-evaluator/scenario-checks.ts`
All scenario-specific checks from spec §5 (Type 1H critical: S3/S14/S23/S29, Type 1 subprompt coverage, Type 2 document validation, and per-scenario overrides S1–S28). Keyword proximity checks, entity format detection, list structure validation.

### 6. `src/lib/input-evaluator/configs.ts`
**Constraint #4**: Exports `SCENARIO_EVAL_CONFIGS: Record<string, ScenarioEvalConfig>` — a mapped object keyed by scenario string ID for all 29 scenarios. Each config contains: group, deviationType, confidenceDependency, block definitions (with minWords, expectedDataType, subPrompts), scenario check definitions, financialImpactGap, commonFailureMode, gdprGuardrail, and enhancedInputItems.

### 7. `src/lib/input-evaluator/index.ts`
Main orchestrator: `evaluateInputQuality(scenarioId: string, formData: Record<string, string>): EvaluationResult`. Pipeline: universal checks → group checks → scenario checks → score calculation (READY/IMPROVABLE/INSUFFICIENT) → confidence flag derivation → financial impact warning assembly.

### 8. `src/hooks/useInputEvaluator.ts`
React hook wrapping `evaluateInputQuality` with 800ms debounce.
**Constraint #3**: Uses `useRef` + `JSON.stringify` comparison to ensure stable `EvaluationResult` reference — only updates state when the serialized result actually changes, preventing infinite re-renders.

## Files to Modify (Phase 2 — this batch)

### 9. `src/components/consolidation/DataRequirementsAlert.tsx`
- Accept optional `evaluation?: EvaluationResult` prop.
- When present, render quality-aware banners (green/amber/red per spec §6.3) with coaching messages and financial impact warnings.
- Show per-block status with inline icons.
- Show GDPR warnings with shield icon when detected.
- Falls back to existing presence-check UI when `evaluation` is undefined.

### 10. `src/components/scenarios/GenericScenarioWizard.tsx`
- Import `useInputEvaluator` hook, call with `scenario.id` and `formData`.
- Pass `EvaluationResult` to `DataRequirementsAlert` on the review step.
- Show inline per-block status indicators (check/warning/alert icons) next to field labels in the input step.
- **Constraint #1**: In `handleAnalyze` and `handleDeepAnalysis`, append `confidence_flag` and `evaluation_score` from the evaluator result to the metadata payload sent to Supabase edge functions (enrichedData object), enabling LangSmith telemetry downstream.
- Add "Unlock deeper analysis" collapsible for missing enhanced inputs when score is READY or IMPROVABLE.
- Show GDPR privacy reminder banner for Group A/C scenarios and S5.

## Key Architecture Constraints Applied

1. **LangSmith telemetry**: `confidence_flag` and `evaluation_score` appended to `enrichedData` in submit handlers → flows through Sentinel to edge functions → picked up by LangSmith tracer metadata.
2. **ReDoS protection**: All PII regexes operate on `text.slice(0, 5000)` with explicit comment.
3. **React performance**: `useInputEvaluator` uses `JSON.stringify` equality check on result before calling `setState`, ensuring referential stability.
4. **Bundle-size ready**: `configs.ts` exports `Record<string, ScenarioEvalConfig>` for future lazy-load splitting.


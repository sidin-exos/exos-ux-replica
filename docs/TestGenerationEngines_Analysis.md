# EXOS Test Data Generation Engines — Architecture Analysis

**Date:** 2026-04-07  
**Purpose:** Root-cause analysis of both engines, their data sources, methodology connections, and advancement opportunities.

---

## Overview: Two Parallel Engines

| Dimension | Engine 1: Static Factory | Engine 2: AI Generator (Edge Function) |
|---|---|---|
| **File** | `src/lib/test-data-factory.ts` (637 lines) | `supabase/functions/generate-test-data/index.ts` (1360 lines) |
| **Runtime** | Client-side (browser) | Server-side (Deno edge function) |
| **AI Involvement** | None — hardcoded templates | Gemini 3.1 Flash Lite via `callGoogleAI` |
| **Auth** | None | Admin-only + rate-limited (10/hr) |
| **Modes** | Single `generateTestData(scenarioId)` | 4 modes: `draft`, `generate`, `messy`, `full` (MCTS) |
| **Output** | `Record<string, string>` | `Record<string, string>` + rich metadata |
| **Fallback** | Is the fallback itself | Falls back to Engine 1 via `generateTestDataHybrid()` |

### Bridge: `src/lib/ai-test-data-generator.ts`
The hybrid wrapper (`generateTestDataHybrid`) tries Engine 2 first, falls back to Engine 1. It also holds client-side industry-category compatibility validation (duplicated from Engine 2).

---

## Engine 1: Static Factory (`test-data-factory.ts`)

### What It Generates
- Hardcoded test data for **29 scenario types** (S1–S29)
- Each generator returns `Record<string, string>` with field IDs matching `scenarios.ts`
- Uses `randomChoice()` to pick from 2-4 pre-written template variants per field

### Data Sources Used
1. **Industry context templates** — 5 industries × 2-3 paragraphs each (manufacturing, software, healthcare, retail, professional). Each ~150 words, rich with real-world detail
2. **Scenario field values** — manually curated realistic values (EUR amounts, supplier names, contract terms, risk registers, etc.)
3. **Field IDs** — synchronized with `src/lib/scenarios.ts` `requiredFields[].id`

### Connection to Platform Methodology
- **Direct**: Field IDs must match `scenarios.ts` — any field rename breaks the factory
- **Indirect**: No connection to `scenario_field_config` DB table, `coaching_cards`, `industry_contexts`, or `procurement_categories`
- **No connection** to quality tiers, deviation types, or GDPR guardrails
- **No persona simulation** — always generates "good" data

### Strengths
- Instant, zero-cost, zero-latency
- Deterministic — good for CI/CD smoke tests
- Covers all 29 scenarios

### Weaknesses
- **Finite diversity**: Only 2-4 variants per field = max ~64 unique combinations per scenario
- **No industry/category awareness**: `industryContext` is random, not matched to scenario
- **No quality tier variation**: Always produces "optimal" quality data
- **No trick embedding**: Cannot test AI's ability to detect subtle issues
- **No persona variation**: Cannot test how the system handles rushed vs. methodical users
- **Drift risk**: Manual sync with `scenarios.ts` field IDs — no automated validation
- **Missing scenarios**: Some newer scenarios may have incomplete generators

---

## Engine 2: AI Generator (`generate-test-data/index.ts`)

### What It Generates
4 distinct modes with different purposes:

| Mode | AI Calls | Purpose | Quality Control |
|---|---|---|---|
| `draft` | 1 | Propose random-but-consistent parameters (industry, category, persona, trick, quality tier) | Industry-category compatibility validation |
| `generate` | 1 | Single-pass generation with pre-approved parameters | Trick embedding score, LangSmith tracing |
| `messy` | 1 | Chaotic/high-friction data for stress testing | GIBBERISH tier instructions |
| `full` | 2×N (generate + validate per iteration) | Legacy MCTS-inspired multi-candidate approach | Validation AI scores candidates 0-100 |

### Data Sources Used

#### 1. `scenario_field_config` Database Table (Primary)
```sql
SELECT block_id, block_label, is_required, expected_data_type, 
       sub_prompts, deviation_type, block_guidance, 
       optimal_guidance, minimum_guidance, degraded_guidance
FROM scenario_field_config WHERE scenario_slug = ?
```
- Provides **per-block generation instructions** including quality-tier-specific guidance
- Determines **deviation type** (0=narrative, 1=structured, 1H=high-stakes, 2=document)
- Lists **sub-prompts** with `isCritical` flags, data types, and realistic ranges
- Falls back to generic `["industryContext"]` if no rows exist

#### 2. Industry-Category Compatibility Matrix (Hardcoded)
- 8 industries × 7-9 categories each
- Duplicated between edge function AND `ai-test-data-generator.ts` client code
- Used to validate and auto-correct AI-drafted parameters

#### 3. Category KPIs (Hardcoded, Partial)
- Only 5 categories have KPIs defined: `raw-materials`, `it-services`, `professional-services`, `logistics`, `capital-equipment`
- **Gap**: Not connected to `procurement_categories.kpis` or `procurement_categories.kpis_v2` in the database

#### 4. Buyer Personas (Hardcoded)
5 archetypes with different behaviors:
| Persona | Optional Fill Rate | Behavior |
|---|---|---|
| `rushed-junior` | 30-40% | Minimal, vague, abbreviations |
| `methodical-manager` | 85-95% | Detailed, structured, precise |
| `cfo-finance` | 40-60% | Numbers-focused, ignores operational fields |
| `frustrated-stakeholder` | 50-70% | Wrong format, complaints, misunderstandings |
| `lost-user` | 0% | Completely irrelevant input |

#### 5. Trick Library (Hardcoded — duplicated in 2 places)
- `supabase/functions/generate-test-data/index.ts` lines 187-493: embedded copy
- `src/lib/trick-library.ts`: standalone module (identical content)
- 7 scenario types × 4 trick categories each = **28 trick categories**
- Each trick has 2-3 template sentences, target fields, and subtlety levels

#### 6. Quality Tier Instructions (`block-guidance.ts`)
- 4 tiers: OPTIMAL, MINIMUM, DEGRADED, GIBBERISH
- Each tier has structural instructions for how to fill blocks
- GDPR guardrail injected into every tier
- Deviation type rules (0, 1, 1H, 2) control data structure expectations

#### 7. MCTS Validation (Full Mode Only)
- Validation AI scores candidates on: Industry Match (30), Category Fit (30), Consistency (20), Usability (20)
- "Be generous" scoring guidance — 70+ is a pass

### Connection to Platform Methodology
| Platform Component | Connection Status |
|---|---|
| `scenario_field_config` table | ✅ **Direct** — reads block definitions, sub-prompts, deviation types, quality guidance |
| `coaching_cards` table | ❌ **Not connected** — could use `coaching_tips`, `common_failure`, `trigger_phrases` |
| `industry_contexts` table | ❌ **Not connected** — uses hardcoded matrix instead of DB `industry_contexts.kpis`, `.constraints` |
| `procurement_categories` table | ❌ **Not connected** — doesn't use `key_cost_drivers`, `kraljic_position`, `market_structure`, `negotiation_dynamics` |
| `validation_rules` table | ❌ **Not connected** — could use rules to verify generated data quality |
| Input Evaluator (`src/lib/input-evaluator/`) | ❌ **Not connected** — generated data is never run through the input evaluator for verification |
| Sentinel Pipeline | ❌ **Not connected** — generated data doesn't feed into sentinel-analysis for end-to-end testing |
| Shadow Log / `test_reports` | ✅ **Indirect** — `get_evolutionary_directives` SQL function extracts patterns from past test runs |

### Strengths
- Infinite diversity via AI generation
- Quality tier and persona variation
- Trick embedding with subtlety scoring
- LangSmith tracing for observability
- DB-driven field configs (no hardcoded schemas)
- GDPR guardrail enforcement

### Weaknesses
- **Cost**: Every call = Gemini API cost + latency
- **No closed-loop validation**: Generated data isn't verified against input evaluator
- **Trick scoring is naive**: Regex-based `scoreTrickEmbedding()` checks for warning words but doesn't verify the trick is actually logically embedded
- **No evolutionary learning**: `get_evolutionary_directives` exists in DB but isn't fed back into the generation prompt
- **Duplicated data**: Trick library, compatibility matrix, and category KPIs all duplicated across files
- **Missing category KPIs**: Only 5 of 60+ categories have KPIs defined
- **No scenario coverage tracking**: No record of which scenario/industry/category combinations have been tested
- **MCTS is weak**: "Full" mode runs N independent generations + validations — it's not true MCTS (no tree search, no backpropagation)

---

## Duplication & Drift Risks

| Data | Location 1 | Location 2 | Risk |
|---|---|---|---|
| Trick Library | `generate-test-data/index.ts` L187-493 | `src/lib/trick-library.ts` | Already diverging (some templates differ) |
| Industry-Category Matrix | `generate-test-data/index.ts` L141-174 | `ai-test-data-generator.ts` L35-68 | Identical currently |
| Category KPIs | `generate-test-data/index.ts` L177-183 | Nowhere else | Only 5 categories, not synced with DB |
| Buyer Personas | `generate-test-data/index.ts` L99-130 | `src/lib/testing/types.ts` (type only) | Types match but no shared data |
| Industry Contexts | `test-data-factory.ts` L23-48 | Not in Engine 2 | Engine 2 generates its own via AI |

---

## Advancement Opportunities

### Tier 1: Quick Wins (Low Risk)

1. **Deduplicate Trick Library**: Single source in `_shared/trick-library.ts`, imported by edge function and frontend
2. **Connect to DB category KPIs**: Replace hardcoded `CATEGORY_KPIS` with a query to `procurement_categories.kpis_v2`
3. **Connect to DB industry contexts**: Use `industry_contexts.kpis` and `.constraints` to enrich generation prompts
4. **Feed evolutionary directives into generation**: Query `get_evolutionary_directives()` and inject as "avoid these patterns" instructions
5. **Add coverage tracking**: Log which scenario/industry/category/persona/tier combinations have been generated to a `test_coverage` table

### Tier 2: Closed-Loop Quality (Medium Risk)

6. **Post-generation input evaluator check**: After generating data, run it through the input evaluator to verify it matches the expected quality tier (OPTIMAL→READY, MINIMUM→IMPROVABLE, DEGRADED→INSUFFICIENT)
7. **AI-powered trick verification**: Replace regex `scoreTrickEmbedding()` with a second AI call that judges whether the trick is properly embedded and detectable by an expert
8. **Coaching card integration**: Use `coaching_cards.common_failure` and `.coaching_tips` to generate data that specifically triggers known failure modes
9. **Connect to procurement_categories metadata**: Use `kraljic_position`, `market_structure`, `negotiation_dynamics`, `supply_concentration` to make generated data category-aware

### Tier 3: Advanced (Higher Effort)

10. **True MCTS or Tree-of-Thought**: Replace the current "generate N candidates independently" with actual tree search — use validation feedback to refine subsequent generations
11. **End-to-end pipeline testing**: Generate data → run through sentinel-analysis → evaluate output quality → store in `test_reports` — fully automated
12. **Adversarial generation**: Use the AI judge's past failures to generate specifically adversarial test cases that target weak spots
13. **Multi-turn generation**: For complex scenarios (Type 2 — document inputs), generate data in multiple passes with self-critique
14. **Static factory modernization**: Replace hardcoded templates in Engine 1 with DB-seeded templates that can be updated without code changes

---

## Architecture Recommendation

```
┌─────────────────────────────────────────────┐
│           Test Orchestrator (UI)             │
│  TestPlanOrchestrator.tsx / LaunchTestBatch  │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────────┐
    │   generateTestDataHybrid │  (ai-test-data-generator.ts)
    │   preferAI → fallback   │
    └──────┬─────────┬────────┘
           │         │
    ┌──────▼───┐  ┌──▼──────────────────────┐
    │ Engine 1 │  │ Engine 2 (Edge Function) │
    │ Static   │  │ 4 modes: draft/gen/     │
    │ Factory  │  │ messy/full              │
    └──────────┘  └─────────┬───────────────┘
                            │
              ┌─────────────▼─────────────┐
              │    Platform Methodology    │
              │ ┌─────────────────────┐   │
              │ │ scenario_field_config│◄──── ✅ Connected
              │ │ (blocks, sub-prompts)│   │
              │ └─────────────────────┘   │
              │ ┌─────────────────────┐   │
              │ │ coaching_cards      │◄──── ❌ Not connected
              │ │ (failure modes)     │   │
              │ └─────────────────────┘   │
              │ ┌─────────────────────┐   │
              │ │ procurement_cats    │◄──── ❌ Not connected  
              │ │ (KPIs, cost drivers)│   │
              │ └─────────────────────┘   │
              │ ┌─────────────────────┐   │
              │ │ industry_contexts   │◄──── ❌ Not connected
              │ │ (KPIs, constraints) │   │
              │ └─────────────────────┘   │
              │ ┌─────────────────────┐   │
              │ │ validation_rules    │◄──── ❌ Not connected
              │ │ (patterns, severity)│   │
              │ └─────────────────────┘   │
              │ ┌─────────────────────┐   │
              │ │ evolutionary_dirs   │◄──── ❌ Exists but unused
              │ │ (past failure learn)│   │
              │ └─────────────────────┘   │
              └───────────────────────────┘
```

**Key insight**: Engine 2 connects to only 1 of 6 available methodology data sources. Connecting to the remaining 5 would dramatically improve generation quality and methodology alignment without changing the engine architecture.

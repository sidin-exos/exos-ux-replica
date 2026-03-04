# Project EXOS: Context Snapshot (2026-03-04)

## 🏁 Milestone: Chatbot Intelligence Layer & UX Polish

**Status:** PRODUCTION-READY (Backend) / BETA (Frontend)

**Current Architecture:** Private Supabase (EXOS-Production) + Edge Functions + Server-Side Grounding

**Key Changes (Mar 4):**
- Chatbot System Instructions v1.0 implemented — 38-page procurement coaching intelligence injected into both chatbot edge functions
- Centralized `_shared/chatbot-instructions.ts` module with structured constants for identity, coaching cards, GDPR protocol, escalation logic
- 4-phase scenario coaching protocol: Orient → Block-by-Block → GDPR Check-In → Confidence Calibration
- 29 per-scenario coaching cards with failure modes, financial impacts, and GDPR guardrails
- Header navigation dropdown alignment fix (centered under trigger, not offset right)
- New `contact_submissions` table added for contact form persistence

---

## 🛡️ Security & Infrastructure

- **Database:** Private Supabase Project (`EXOS-Production`) via Lovable Cloud.
- **RLS Policies:** All 14 public tables have RLS enabled.
  - `test_prompts/reports`: Admin-only access.
  - `chat_feedback`: Anon insert (ratings), admin read.
  - `intel_queries`: Public read for market research transparency.
  - `market_insights`: Service Role Write Only (Client is Read-Only).
  - `shared_reports`: Access via Security Definer functions only.
  - `saved_intel_configs`: User-scoped CRUD (auth.uid() = user_id).
  - `scenario_feedback`: Anon insert.
  - `validation_rules`: Admin-only write, public read.
  - `contact_submissions`: Public insert for contact form submissions.
- **Shared Reports Hardening (since Feb 9):**
  - `create_shared_report` RPC: server-side ID generation via `gen_random_bytes(16)` (128-bit entropy).
  - 1MB payload limit enforced at DB level.
  - `anon` access revoked — authenticated users only.
- **RPCs:**
  - `save_intel_to_knowledge_base` — SECURITY DEFINER function for authenticated users to insert into admin-protected `market_insights` table.
  - `create_shared_report` / `get_shared_report` — Security Definer functions for shareable reports.
  - `get_evolutionary_directives` — Aggregates validation improvement signals.
  - `has_role` — SECURITY DEFINER role check bypassing RLS recursion.
- **Secrets:** All API Keys (Perplexity, Google, LangSmith, Lovable) managed in Supabase Edge Secrets.

## ⚡ Performance & Cost Optimization

- **Surgical Context Injection:**
  - Grounding logic runs server-side in `sentinel-analysis` edge function.
  - Fetches ONLY specific Industry/Category rows via slugs.
  - Reduced input token usage by ~60% per request.
- **Chatbot Token Budgets:**
  - `chat-copilot`: ~3,000 tokens (identity + conversation architecture + GDPR + escalation + scenario nav).
  - `scenario-chat-assistant`: ~1,500 tokens (abbreviated identity + coaching protocol + ONE scenario card + GDPR interception).
- **Lazy Loading:**
  - `RecentQueries` component uses "Pull" model (load on click).
  - No ghost API calls or tracing costs on page reload.

## 👁️ Observability (LangSmith)

- **Status:** Active (Server-Side only).
- **Mode:** "Production Quiet" (No verbose logs, only Errors & Critical Metrics).
- **Client-Side:** Tracing disabled to prevent API key exposure.
- **Tracing:**
  - Parent Run: `sentinel-analysis` (Chain)
  - Child Spans: `fetch-context` (Tool), `assemble-prompt` (Tool), `ai-inference` (Chain)
  - Metadata: Captures `industrySlug`, `categorySlug`, `processingTime`.
  - Excludes raw prompt text for security.

## 🏗️ Active Components

1. **Sentinel Pipeline:**
   - **Input:** Anonymized User Prompt + Slugs.
   - **Processing:** Edge function fetches industry/category from DB, builds grounding XML server-side, calls AI gateway (Lovable or Google AI Studio).
   - **Output:** Raw AI response returned for client-side validation + de-anonymization.
   - **Retry:** 3 attempts with exponential backoff on 503s. Provider fallback (Google → Lovable Gateway) on 429/5xx.

2. **Chatbot Intelligence Layer (NEW — Mar 4):**
   - **Central Module:** `_shared/chatbot-instructions.ts` exports `BOT_IDENTITY`, `CONVERSATION_ARCHITECTURE`, `SCENARIO_NAV_GUIDANCE`, `SCENARIO_COACHING_CARDS`, `GDPR_PROTOCOL`, `ESCALATION_PROTOCOL`, `QUICK_REFERENCES`.
   - **Chat Copilot:** Uses full identity + conversation architecture + scenario discovery flow with trigger phrases + GDPR/escalation protocols.
   - **Scenario Assistant:** Injects the ONE relevant coaching card per scenario (purpose, min required, enhanced, common failure, financial impact, GDPR guardrail, coaching tips) + 4-phase coaching protocol.
   - **Hard Boundaries:** Never ask for raw PII, never give legal/tax/financial advice, never fabricate data, never replicate the Sentinel analysis engine.

3. **Market Intelligence (3 modes):**
   - **Ad-hoc Research (Active):** Perplexity Sonar Pro API via edge function. Search filters: recency, domain type. Market Snapshot: authenticated, Perplexity + quality gate.
   - **Scheduled Reports (Active — UI + persistence, cron deferred):** Users save query configs to `saved_intel_configs` table. `ScheduledReportsPanel` component for managing saved configs. Cron execution deferred to future milestone.
   - **Triggered Monitoring (Enterprise gate):** `EnterpriseTriggerGate` component gates access. Config persistence ready (`saved_intel_configs` with `config_type = 'triggered'`). Actual trigger execution behind Enterprise tier.
   - **Save to Knowledge Base:** `SaveToKnowledgeBaseDialog` allows saving intel results to `market_insights` via `save_intel_to_knowledge_base` RPC for grounding reuse.

4. **Shareable Reports:**
   - Security Definer functions for create/get.
   - 128-bit server-side ID generation.
   - 5-day expiry with opportunistic cleanup.
   - 1MB payload limit.

5. **Chat Widget (EXOS Guide):**
   - Public-facing onboarding chatbot — no auth required.
   - Auto-scroll only on new message addition.
   - Now powered by full procurement coaching intelligence layer.

6. **Scenario Tutorial:**
   - Public edge function, no auth.
   - AI-generated contextual tips per scenario + industry/category.

7. **Report Exports:**
   - **Excel (.xlsx):** Functional via `xlsx` library. Exports scenario data + analysis results.
   - **Jira:** Copy-to-clipboard in Jira-compatible markdown format.
   - **PDF:** React-PDF renderer with dashboard visuals.

8. **Dashboard Showcase:**
   - Internal/sales demo page at `/dashboards`.
   - "Demo Mode — Sample Data" banner clearly labels illustrative data.

## 📝 UX Meta-Pattern (established Feb 20)

Every scenario follows a universal "3-Block Meta-Pattern":
1. **`industryContext`** (textarea, required) — Industry & business context
2. **2–3 scenario-specific textareas** (required) — Core data blocks
3. **1–2 optional textareas** — Additional context, benchmarks, constraints

22 of 29 scenarios refactored from micro-field forms (10–25 fields) to 3–5 textareas.

## 🧪 Remaining Mocks Audit

| Priority | Mock | Description | Path to Real |
|----------|------|-------------|--------------|
| **P0** | Stripe Integration | Pricing page has no real payment flow | Stripe Connector + Checkout Session |
| **P0** | Consolidation Wizard AI | `mockResults` hardcoded in `ConsolidationWizard.tsx` | Wire to `sentinel-analysis` edge function |
| **P1** | Chat Persistence | Chat history lost on page reload | Store in `chat_messages` table |
| **P2** | PDF Export Stubs | Some dashboard PDF visuals use placeholder data | Wire to real parsed dashboard data |
| **P2** | pgvector Search | Knowledge base search is basic text match | Add pgvector extension + embeddings |
| **P2** | Scheduled Reports Cron | Configs saved but not auto-executed | pg_cron or external scheduler |
| **P3** | Demo Mode Labels | Only Dashboard Showcase has demo banner | Add to other demo-data pages |
| **P3** | Enterprise Trigger Gate | UI-only gate, no tier check | Wire to subscription/tier system |
| **P3** | Founder Dashboard Metrics | Manual entry only | Auto-aggregate from usage data |
| **P3** | Deep Analysis Pipeline | UI animation only, no real multi-stage pipeline | Wire stages to separate edge function calls |

## 📦 Edge Functions Inventory (8 functions + shared)

| Function | Auth | Purpose |
|----------|------|---------|
| `chat-copilot` | Public (no auth) | Onboarding chatbot with full coaching intelligence |
| `scenario-chat-assistant` | Public (no auth) | Per-scenario coaching with 4-phase protocol |
| `scenario-tutorial` | Public (no auth) | Contextual scenario tips |
| `sentinel-analysis` | Authenticated | AI inference with server-side grounding + LangSmith tracing |
| `market-intelligence` | Authenticated | Perplexity Sonar Pro market research |
| `market-snapshot` | Authenticated | Perplexity + quality gate |
| `generate-market-insights` | Admin only | Market insights generation |
| `generate-test-data` | Admin only | Test data factory |

**Shared Utilities:**
- `_shared/auth.ts` — JWT validation via `getClaims()`, admin role check
- `_shared/validate.ts` — Input validation, size limits, type coercion
- `_shared/langsmith.ts` — Fire-and-forget LangSmith REST tracer
- `_shared/chatbot-instructions.ts` — Centralized chatbot intelligence (identity, coaching cards, GDPR, escalation)
- `_shared/anonymizer.ts` — PII anonymization utilities

## 🖥️ Frontend

- **29 procurement scenarios** (all following 3-Block Meta-Pattern or functional-select patterns).
- **16 routes** in `App.tsx`: `/`, `/features`, `/reports`, `/pricing`, `/faq`, `/report`, `/dashboards`, `/market-intelligence`, `/architecture`, `/dev-workflow`, `/testing-pipeline`, `/org-chart`, `/auth`, `/account`, `/admin/dashboard`, `*` (404).
- **Authentication:** Google OAuth.
- **Header:** Desktop dropdown menus centered under navigation triggers (fixed Mar 4).

## 📊 Database Tables (14)

| Table | Purpose |
|-------|---------|
| `chat_feedback` | User ratings for chatbot responses |
| `contact_submissions` | Contact form submissions |
| `founder_metrics` | Internal KPIs (MRR, burn rate, runway) |
| `industry_contexts` | Industry-specific constraints & KPIs for grounding |
| `intel_queries` | Market intelligence query log |
| `market_insights` | AI-generated market grounding data (one active per combo) |
| `procurement_categories` | Category characteristics & KPIs for grounding |
| `saved_intel_configs` | Saved scheduled/triggered intel query configurations |
| `scenario_feedback` | User ratings for scenario outputs |
| `shared_reports` | Time-limited shareable report payloads |
| `test_prompts` | Stored prompts for benchmarking |
| `test_reports` | AI response logs for benchmarking |
| `user_roles` | Admin/user role assignments |
| `validation_rules` | AI output validation patterns |

## 📂 Key Files Reference

- **Scenarios definition:** `src/lib/scenarios.ts`
- **Test data factory:** `src/lib/test-data-factory.ts`
- **Pipeline orchestrator:** `src/lib/ai/graph.ts`
- **Sentinel types:** `src/lib/sentinel/types.ts`
- **LangSmith tracer (edge):** `supabase/functions/_shared/langsmith.ts`
- **Auth helper (edge):** `supabase/functions/_shared/auth.ts`
- **Validation helper (edge):** `supabase/functions/_shared/validate.ts`
- **Chatbot instructions (edge):** `supabase/functions/_shared/chatbot-instructions.ts`
- **Anonymizer:** `src/lib/sentinel/anonymizer.ts`
- **Grounding (server, active):** built into `sentinel-analysis/index.ts`
- **Grounding (client, legacy):** `src/lib/sentinel/grounding.ts`
- **Context templates:** `src/lib/ai-context-templates.ts`
- **Dashboard mappings:** `src/lib/dashboard-mappings.ts`
- **Chat service:** `src/lib/chat-service.ts`
- **Scenario chat service:** `src/lib/scenario-chat-service.ts`
- **Report export (Excel):** `src/lib/report-export-excel.ts`
- **Report export (Jira):** `src/lib/report-export-jira.ts`
- **Saved intel configs hook:** `src/hooks/useSavedIntelConfigs.ts`
- **Context data hook:** `src/hooks/useContextData.ts`

## 📄 Documentation

- `docs/AI_WORKFLOW.md` — Chain-of-Experts constitution
- `docs/ORG_CHART.md` — AI-first organizational structure
- `docs/PROJECT_CONTEXT_2026-02-06.md` — Snapshot: LangSmith Integration
- `docs/PROJECT_CONTEXT_2026-02-09.md` — Snapshot: Infrastructure Independence
- `docs/PROJECT_CONTEXT_2026-02-17.md` — Snapshot: Security Hardening
- `docs/PROJECT_CONTEXT_2026-02-20.md` — Snapshot: UX Meta-Pattern Refactoring
- `docs/PROJECT_CONTEXT_2026-02-24.md` — Snapshot: Market Intelligence Expansion & Mocks Audit
- `docs/PROJECT_CONTEXT_2026-03-04.md` — This file

## 🔗 URLs

- **Published:** `https://optimal-buy.lovable.app`
- **Download this file:** `https://optimal-buy.lovable.app/PROJECT_CONTEXT_2026-03-04.md`

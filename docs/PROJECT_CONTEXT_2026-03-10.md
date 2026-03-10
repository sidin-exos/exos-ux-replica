# Project EXOS: Context Snapshot (2026-03-10)

## 🏁 Milestone: Multi-Tenant Architecture & Enterprise Platforms

**Status:** PRODUCTION-READY (Backend) / BETA (Frontend)

**Current Architecture:** Private Supabase (EXOS-Production) + Edge Functions + Server-Side Grounding + Multi-Tenant Org Model

**Key Changes (Mar 10):**
- Multi-tenant organization model: `organizations` table, `profiles` table with `org_role` enum (`admin | manager | user`)
- Most tables now scoped to `organization_id` FK — RLS policies updated to org-aware checks via `get_user_org_id()` and `is_org_admin()`
- Enterprise Platform pages: `/enterprise/risk` and `/enterprise/inflation` with `TrackerSetupWizard`, `TrackerList`, and `FileUploadZone` components
- New `enterprise_trackers` table for persistent tracker storage with file references
- Scenario card UX overhaul: descriptions replaced with 2-3 keyword tags per scenario, icon sizes reduced (~17%)
- Mobile bottom navigation bar (`MobileBottomNav`) with safe-area support
- New `pipeline_iq_stats` database view for aggregated pipeline metrics

---

## 🛡️ Security & Infrastructure

- **Database:** Private Supabase Project (`EXOS-Production`) via Lovable Cloud.
- **Multi-Tenant Model:** All user-owned data scoped to `organization_id`. Org membership tracked via `profiles.organization_id`.
- **RLS Policies:** All 17 public tables have RLS enabled.
  - `enterprise_trackers`: User-scoped CRUD within own org (`auth.uid() = user_id AND organization_id = get_user_org_id()`).
  - `profiles`: Own profile or org admin can read/update.
  - `organizations`: Members can read own org; admins can update; insert only if no existing org.
  - `test_prompts/reports`: Admin-only access within org.
  - `chat_feedback`: Anon insert (ratings), org admin read.
  - `intel_queries`: Authenticated read within org.
  - `market_insights`: Service Role Write Only (Client is Read-Only).
  - `shared_reports`: Access via Security Definer functions only.
  - `saved_intel_configs`: User-scoped CRUD within org.
  - `scenario_feedback`: Anon insert.
  - `validation_rules`: Public read only.
  - `contact_submissions`: Public insert, org admin read.
  - `founder_metrics`: Org admin only.
- **Shared Reports Hardening (since Feb 9):**
  - `create_shared_report` RPC: server-side ID generation via `gen_random_bytes(16)` (128-bit entropy).
  - 1MB payload limit enforced at DB level.
  - `anon` access revoked — authenticated users only.
- **RPCs:**
  - `get_user_org_id` — Returns user's organization ID from profiles.
  - `get_user_org_role` — Returns user's org_role from profiles.
  - `is_org_admin` — Checks if user has `admin` org_role.
  - `save_intel_to_knowledge_base` — SECURITY DEFINER function for authenticated users to insert into admin-protected `market_insights` table.
  - `create_shared_report` / `get_shared_report` — Security Definer functions for shareable reports.
  - `get_evolutionary_directives` — Aggregates validation improvement signals.
  - `has_role` — SECURITY DEFINER role check bypassing RLS recursion (for `app_role`).
- **Enums:**
  - `app_role`: `admin | user` (used in `user_roles` table).
  - `org_role`: `admin | manager | user` (used in `profiles` table).
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

2. **Chatbot Intelligence Layer (since Mar 4):**
   - **Central Module:** `_shared/chatbot-instructions.ts` exports `BOT_IDENTITY`, `CONVERSATION_ARCHITECTURE`, `SCENARIO_NAV_GUIDANCE`, `SCENARIO_COACHING_CARDS`, `GDPR_PROTOCOL`, `ESCALATION_PROTOCOL`, `QUICK_REFERENCES`.
   - **Chat Copilot:** Uses full identity + conversation architecture + scenario discovery flow with trigger phrases + GDPR/escalation protocols.
   - **Scenario Assistant:** Injects the ONE relevant coaching card per scenario + 4-phase coaching protocol.
   - **Hard Boundaries:** Never ask for raw PII, never give legal/tax/financial advice, never fabricate data.

3. **Market Intelligence (3 modes):**
   - **Ad-hoc Research (Active):** Perplexity Sonar Pro API via edge function. Search filters: recency, domain type. Market Snapshot: authenticated, Perplexity + quality gate.
   - **Scheduled Reports (Active — UI + persistence, cron deferred):** Users save query configs to `saved_intel_configs` table. `ScheduledReportsPanel` component for managing saved configs.
   - **Triggered Monitoring (Enterprise gate):** `EnterpriseTriggerGate` component gates access. Config persistence ready.
   - **Save to Knowledge Base:** `SaveToKnowledgeBaseDialog` allows saving intel results to `market_insights` via `save_intel_to_knowledge_base` RPC.

4. **Enterprise Platforms (NEW — Mar 10):**
   - **Risk Platform** (`/enterprise/risk`): Tracker setup wizard for risk monitoring. File upload zone for supporting documents. Tracker list with status badges (active/setup/paused).
   - **Inflation Platform** (`/enterprise/inflation`): Same architecture as Risk Platform, scoped to inflation tracking.
   - **Shared Components:** `TrackerSetupWizard`, `TrackerList`, `FileUploadZone`.
   - **Data Layer:** `enterprise_trackers` table with org-scoped RLS. `useEnterpriseTrackers` hook with React Query for CRUD + file upload to `tracker-files` storage bucket.

5. **Shareable Reports:**
   - Security Definer functions for create/get.
   - 128-bit server-side ID generation.
   - 5-day expiry with opportunistic cleanup.
   - 1MB payload limit.

6. **Chat Widget (EXOS Guide):**
   - Public-facing onboarding chatbot — no auth required.
   - Auto-scroll only on new message addition.
   - Powered by full procurement coaching intelligence layer.

7. **Scenario Tutorial:**
   - Public edge function, no auth.
   - AI-generated contextual tips per scenario + industry/category.

8. **Report Exports:**
   - **Excel (.xlsx):** Functional via `xlsx` library.
   - **Jira:** Copy-to-clipboard in Jira-compatible markdown format.
   - **PDF:** React-PDF renderer with dashboard visuals.

9. **Dashboard Showcase:**
   - Internal/sales demo page at `/dashboards`.
   - "Demo Mode — Sample Data" banner clearly labels illustrative data.

## 📝 UX Meta-Pattern

Every scenario follows a universal "3-Block Meta-Pattern":
1. **`industryContext`** (textarea, required) — Industry & business context
2. **2–3 scenario-specific textareas** (required) — Core data blocks
3. **1–2 optional textareas** — Additional context, benchmarks, constraints

22 of 29 scenarios refactored from micro-field forms (10–25 fields) to 3–5 textareas.

**Scenario Card Tags (NEW — Mar 10):** Each scenario card displays 2-3 keyword tags (e.g., `Lifecycle Cost`, `NPV`, `BATNA`) instead of full descriptions. Tags render as `Badge variant="outline"` with `text-[10px]` sizing. Full descriptions preserved for preview panel.

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
- `_shared/google-ai.ts` — Google AI Studio client

## 🖥️ Frontend

- **29 procurement scenarios** (all following 3-Block Meta-Pattern or functional-select patterns).
- **Scenario Cards:** Display 2-3 keyword tags instead of descriptions. Icons reduced to `w-10 h-10` / `w-5 h-5`.
- **18 routes** in `App.tsx`: `/`, `/features`, `/reports`, `/pricing`, `/faq`, `/report`, `/dashboards`, `/market-intelligence`, `/architecture`, `/dev-workflow`, `/testing-pipeline`, `/org-chart`, `/auth`, `/account`, `/admin/dashboard`, `/enterprise/risk`, `/enterprise/inflation`, `*` (404).
- **Authentication:** Google OAuth.
- **Mobile:** Bottom navigation bar (`MobileBottomNav`) with 5 tabs (Scenarios, Intel, Tech, Dashboards, Pricing). Body padding `pb-14 md:pb-0` for safe area.

## 📊 Database Tables (17) + 1 View

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant org container (name, settings) |
| `profiles` | User profiles with `org_role` and `organization_id` FK |
| `chat_feedback` | User ratings for chatbot responses |
| `contact_submissions` | Contact form submissions |
| `enterprise_trackers` | Risk/inflation tracker configs with file references |
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
| `user_roles` | Admin/user role assignments (`app_role`) |
| `validation_rules` | AI output validation patterns |

| View | Purpose |
|------|---------|
| `pipeline_iq_stats` | Aggregated accuracy, processing time, run counts by batch date |

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
- **Enterprise trackers hook:** `src/hooks/useEnterpriseTrackers.ts`
- **Enterprise platforms:** `src/pages/enterprise/RiskPlatform.tsx`, `src/pages/enterprise/InflationPlatform.tsx`
- **Enterprise components:** `src/components/enterprise/TrackerSetupWizard.tsx`, `src/components/enterprise/TrackerList.tsx`, `src/components/enterprise/FileUploadZone.tsx`
- **Mobile navigation:** `src/components/layout/MobileBottomNav.tsx`
- **Scenario card:** `src/components/dashboard/ScenarioCard.tsx`

## 📄 Documentation

- `docs/AI_WORKFLOW.md` — Chain-of-Experts constitution
- `docs/ORG_CHART.md` — AI-first organizational structure
- `docs/PROJECT_CONTEXT_2026-02-06.md` — Snapshot: LangSmith Integration
- `docs/PROJECT_CONTEXT_2026-02-09.md` — Snapshot: Infrastructure Independence
- `docs/PROJECT_CONTEXT_2026-02-17.md` — Snapshot: Security Hardening
- `docs/PROJECT_CONTEXT_2026-02-20.md` — Snapshot: UX Meta-Pattern Refactoring
- `docs/PROJECT_CONTEXT_2026-02-24.md` — Snapshot: Market Intelligence Expansion & Mocks Audit
- `docs/PROJECT_CONTEXT_2026-03-04.md` — Snapshot: Chatbot Intelligence Layer & UX Polish
- `docs/PROJECT_CONTEXT_2026-03-10.md` — This file

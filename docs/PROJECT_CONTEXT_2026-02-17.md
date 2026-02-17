# Project EXOS: Context Snapshot (2026-02-17)

## 🏁 Milestone: Security Hardening & Public Access Optimization

**Status:** PRODUCTION-READY (Backend) / BETA (Frontend)

**Current Architecture:** Private Supabase (EXOS-Production) + Edge Functions + Server-Side Grounding

---

## 🛡️ Security & Infrastructure

- **Database:** Private Supabase Project (`EXOS-Production`) via Lovable Cloud.
- **RLS Policies:** All 10 public tables have RLS enabled.
  - `test_prompts/reports`: Admin-only access.
  - `chat_feedback`: Anon insert (ratings), admin read.
  - `intel_queries`: Public read for market research transparency.
  - `market_insights`: Service Role Write Only (Client is Read-Only).
  - `shared_reports`: Access via Security Definer functions only.
- **Shared Reports Hardening (since Feb 9):**
  - `create_shared_report` RPC: server-side ID generation via `gen_random_bytes(16)` (128-bit entropy).
  - 1MB payload limit enforced at DB level.
  - `anon` access revoked — authenticated users only.
- **Secrets:** All API Keys (Perplexity, Google, LangSmith, Lovable) managed in Supabase Edge Secrets.

## ⚡ Performance & Cost Optimization

- **Surgical Context Injection:**
  - Grounding logic runs server-side in `sentinel-analysis` edge function.
  - Fetches ONLY specific Industry/Category rows via slugs.
  - Reduced input token usage by ~60% per request.
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

2. **Market Intelligence:**
   - Perplexity Sonar Pro API via edge function.
   - Search filters: recency, domain type.
   - Market Snapshot: authenticated, Perplexity + quality gate.

3. **Shareable Reports:**
   - Security Definer functions for create/get.
   - 128-bit server-side ID generation.
   - 5-day expiry with opportunistic cleanup.
   - 1MB payload limit.

4. **Chat Widget (EXOS Guide):**
   - Public-facing onboarding chatbot — no auth required.
   - Typewriter auto-scroll bug fixed (removed per-character `onTextReveal`).
   - Auto-scroll only on new message addition.

5. **Scenario Tutorial:**
   - Public edge function, no auth.
   - AI-generated contextual tips per scenario + industry/category.

## 📦 Edge Functions Inventory (8 total)

| Function | Auth | Purpose |
|----------|------|---------|
| `chat-copilot` | Public (no auth) | Onboarding chatbot |
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

## 🖥️ Frontend

- **29 procurement scenarios** (reordered: Cost Breakdown and Spend Analysis at top of Analysis & Optimization).
- **14 routes** in `App.tsx`: `/`, `/features`, `/reports`, `/pricing`, `/faq`, `/report`, `/dashboards`, `/market-intelligence`, `/architecture`, `/dev-workflow`, `/org-chart`, `/auth`, `/account`, `/admin/dashboard`, `*` (404).
- **Technology page:** "Commercial Data Safety" card with link to `/architecture`.
- **Authentication:** Google OAuth.

## 📊 Database Tables (10)

| Table | Purpose |
|-------|---------|
| `chat_feedback` | User ratings for chatbot responses |
| `founder_metrics` | Internal KPIs (MRR, burn rate, runway) |
| `industry_contexts` | Industry-specific constraints & KPIs for grounding |
| `intel_queries` | Market intelligence query log |
| `market_insights` | AI-generated market grounding data (one active per combo) |
| `procurement_categories` | Category characteristics & KPIs for grounding |
| `shared_reports` | Time-limited shareable report payloads |
| `test_prompts` | Stored prompts for benchmarking |
| `test_reports` | AI response logs for benchmarking |
| `user_roles` | Admin/user role assignments |

## 📂 Key Files Reference

- **Pipeline orchestrator:** `src/lib/ai/graph.ts`
- **Sentinel types:** `src/lib/sentinel/types.ts`
- **LangSmith tracer (edge):** `supabase/functions/_shared/langsmith.ts`
- **Auth helper (edge):** `supabase/functions/_shared/auth.ts`
- **Validation helper (edge):** `supabase/functions/_shared/validate.ts`
- **Anonymizer:** `src/lib/sentinel/anonymizer.ts`
- **Grounding (server, active):** built into `sentinel-analysis/index.ts`
- **Grounding (client, legacy):** `src/lib/sentinel/grounding.ts`
- **Context templates:** `src/lib/ai-context-templates.ts`
- **Scenarios definition:** `src/lib/scenarios.ts`
- **Dashboard mappings:** `src/lib/dashboard-mappings.ts`
- **Chat service:** `src/lib/chat-service.ts`

## 📄 Documentation

- `docs/AI_WORKFLOW.md` — Chain-of-Experts constitution
- `docs/ORG_CHART.md` — AI-first organizational structure
- `docs/PROJECT_CONTEXT_2026-02-06.md` — Snapshot: LangSmith Integration
- `docs/PROJECT_CONTEXT_2026-02-09.md` — Snapshot: Infrastructure Independence
- `docs/PROJECT_CONTEXT_2026-02-17.md` — This file

## 🔗 URLs

- **Published:** `https://optimal-buy.lovable.app`
- **Download this file:** `https://optimal-buy.lovable.app/PROJECT_CONTEXT_2026-02-17.md`

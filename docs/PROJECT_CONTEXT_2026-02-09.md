# Project EXOS: Context Snapshot (2026-02-09)

## 🏁 Milestone: Infrastructure Independence & Optimization

**Status:** PRODUCTION-READY (Backend) / BETA (Frontend)

**Current Architecture:** Self-Hosted Supabase + Edge Functions + Server-Side Grounding

---

## 🛡️ Security & Infrastructure

- **Database:** Migrated from Lovable Managed to Private Supabase Project (`EXOS-Production`).
- **RLS Policies:** Hardened (Level: Bronze).
  - `test_prompts/reports`: Public Read / Auth Write / No Delete.
  - `market_insights`: Service Role Write Only (Client is Read-Only).
  - `shared_reports`: Access via Security Definer functions only.
- **Secrets:** All API Keys (Perplexity, Google, LangSmith) are managed in Supabase Edge Secrets.

## ⚡ Performance & Cost Optimization

- **Surgical Context Injection:**
  - Moved grounding logic from Client to Edge Function (`sentinel-analysis`).
  - Fetches ONLY specific Industry/Category rows via slugs.
  - Reduced input token usage by ~60% per request.
- **Lazy Loading:**
  - `RecentQueries` component refactored to "Pull" model (load on click).
  - Eliminated "ghost" API calls and tracing costs on page reload.

## 👁️ Observability (LangSmith)

- **Status:** Active (Server-Side).
- **Mode:** "Production Quiet" (Verbose logs removed, only Errors & Critical Metrics logged).
- **Tracing:**
  - Parent Run: `sentinel-analysis` (Chain)
  - Child Run: `google-ai-studio` / `ai-gateway` (LLM)
  - Metadata: Captures `industrySlug`, `categorySlug`, `processingTime`.

## 🏗️ Active Components

1. **Sentinel Pipeline:**
   - **Input:** Anonymized User Prompt + Slugs.
   - **Processing:** Edge function fetches industry/category from DB, builds grounding XML server-side, calls AI gateway (Lovable or Google AI Studio).
   - **Output:** Raw AI response returned for client-side validation + de-anonymization.
   - **Retry:** 3 attempts with exponential backoff on 503s.

2. **Market Intelligence:**
   - Perplexity Sonar Pro API via edge function.
   - Search filters: recency, domain type.

3. **Shareable Reports:**
   - Security Definer functions for create/get.
   - Time-based expiry with opportunistic cleanup.

## 📦 Edge Functions Inventory

| Function | Purpose |
|----------|---------|
| `sentinel-analysis` | AI inference with server-side grounding |
| `market-intelligence` | Perplexity-powered market research |
| `generate-market-insights` | Market insights generation |
| `generate-test-data` | Test data factory |

## 📂 Key Files Reference

- **Pipeline orchestrator:** `src/lib/ai/graph.ts`
- **Sentinel types:** `src/lib/sentinel/types.ts`
- **LangSmith client (browser):** `src/lib/ai/langsmith-client.ts`
- **LangSmith tracer (edge):** `supabase/functions/_shared/langsmith.ts`
- **Anonymizer:** `src/lib/sentinel/anonymizer.ts`
- **Grounding (client, legacy):** `src/lib/sentinel/grounding.ts`
- **Grounding (server, active):** built into `sentinel-analysis/index.ts`

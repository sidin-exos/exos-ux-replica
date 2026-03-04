# EXOS RLS Policy Audit — 2026-03-04

## 1. Summary

| Table | RLS | SELECT | INSERT | UPDATE | DELETE | Access Pattern |
|-------|-----|--------|--------|--------|--------|----------------|
| `chat_feedback` | ✅ | ❌ Blocked | ✅ User-scoped (`auth.uid() = user_id`) | ❌ | ❌ | User-scoped INSERT only |
| `contact_submissions` | ✅ | ✅ Admin | ✅ Public (`true`) | ❌ | ❌ | Public INSERT, admin READ |
| `founder_metrics` | ✅ | ✅ Admin | ✅ Admin | ✅ Admin | ❌ | Admin-only CRUD (no DELETE) |
| `industry_contexts` | ✅ | ✅ Public (`true`) | ❌ | ❌ | ❌ | Public read-only |
| `intel_queries` | ✅ | ✅ Public (`true`) | ❌ | ❌ | ❌ | Public read-only |
| `market_insights` | ✅ | ✅ Public (`true`) | ❌ | ❌ | ❌ | Public read-only (write via RPC) |
| `procurement_categories` | ✅ | ✅ Public (`true`) | ❌ | ❌ | ❌ | Public read-only |
| `saved_intel_configs` | ✅ | ✅ User + Admin | ✅ User-scoped | ✅ User-scoped | ✅ User-scoped | User-scoped CRUD + admin read |
| `scenario_feedback` | ✅ | ✅ Admin | ✅ Public (`true`) | ❌ | ❌ | Public INSERT, admin READ |
| `shared_reports` | ✅ | ❌ (`false`) | ❌ (`false`) | ❌ (`false`) | ❌ (`false`) | Fully locked — RPC-only access |
| `test_prompts` | ✅ | ✅ Admin | ✅ Admin | ❌ | ❌ | Admin-only (no UPDATE/DELETE) |
| `test_reports` | ✅ | ✅ Admin | ✅ Admin | ❌ | ❌ | Admin-only (no UPDATE/DELETE) |
| `user_roles` | ✅ | ✅ Admin | ❌ | ❌ | ❌ | Admin read-only (write via service role) |
| `validation_rules` | ✅ | ✅ Public (`true`) | ❌ | ❌ | ❌ | Public read-only |

**View:** `pipeline_iq_stats` — No RLS policies (view with `security_invoker = on`, inherits from `test_reports`).

---

## 2. Per-Table Detail

### 2.1 `chat_feedback`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | No | `gen_random_uuid()` |
| `message_id` | text | No | — |
| `rating` | text | No | — |
| `user_id` | uuid | **Yes** | — |
| `conversation_messages` | jsonb | Yes | — |
| `created_at` | timestamptz | Yes | `now()` |

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Authenticated users can insert own feedback | INSERT | RESTRICTIVE | `auth.uid() = user_id` |

**Blocked:** SELECT, UPDATE, DELETE.

⚠️ **Risk:** `user_id` is nullable but used in INSERT policy expression `auth.uid() = user_id`. If `user_id` is NULL and `auth.uid()` is NULL (anon), `NULL = NULL` evaluates to `NULL` (falsy) → INSERT denied. This means **anonymous users cannot submit feedback**, which contradicts the PROJECT_CONTEXT description of "Anon insert." See §4.1.

⚠️ **Risk:** No SELECT policy exists — not even for admins. Admin cannot read feedback without service role key.

---

### 2.2 `contact_submissions`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | No | `gen_random_uuid()` |
| `name` | text | No | — |
| `email` | text | No | — |
| `company` | text | Yes | — |
| `subject` | text | No | — |
| `message` | text | No | — |
| `created_at` | timestamptz | No | `now()` |

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Anyone can submit contact form | INSERT | RESTRICTIVE | `true` |
| Admins can read contact submissions | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** UPDATE, DELETE. ✅ Correct for a contact form table.

---

### 2.3 `founder_metrics`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Admins can select founder_metrics | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |
| Admins can insert founder_metrics | INSERT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |
| Admins can update founder_metrics | UPDATE | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** DELETE. ✅ Appropriate for financial KPIs.

---

### 2.4 `industry_contexts`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Industry contexts are publicly readable | SELECT | RESTRICTIVE | `true` |

**Blocked:** INSERT, UPDATE, DELETE. ✅ Reference data — write via service role only.

---

### 2.5 `intel_queries`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Allow public read access to intel_queries | SELECT | RESTRICTIVE | `true` |

**Blocked:** INSERT, UPDATE, DELETE. ✅ Query log is public read, write via edge function (service role).

---

### 2.6 `market_insights`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Market insights are publicly readable | SELECT | RESTRICTIVE | `true` |

**Blocked:** INSERT, UPDATE, DELETE. Write access via `save_intel_to_knowledge_base` RPC (SECURITY DEFINER). ✅

---

### 2.7 `procurement_categories`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Procurement categories are publicly readable | SELECT | RESTRICTIVE | `true` |

**Blocked:** INSERT, UPDATE, DELETE. ✅ Reference data.

---

### 2.8 `saved_intel_configs`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Users can select own configs | SELECT | RESTRICTIVE | `auth.uid() = user_id` |
| Admins can read all configs | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |
| Users can insert own configs | INSERT | RESTRICTIVE | `auth.uid() = user_id` |
| Users can update own configs | UPDATE | RESTRICTIVE | `auth.uid() = user_id` |
| Users can delete own configs | DELETE | RESTRICTIVE | `auth.uid() = user_id` |

⚠️ **Note:** All policies are RESTRICTIVE. For SELECT, the two RESTRICTIVE policies (`user_id` match AND admin check) are combined with AND — meaning even admins must satisfy `auth.uid() = user_id` to read. **This likely defeats the admin override intent.** See §4.2.

---

### 2.9 `scenario_feedback`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Anyone can submit scenario feedback | INSERT | RESTRICTIVE | `true` |
| Admins can read scenario feedback | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** UPDATE, DELETE. ✅

---

### 2.10 `shared_reports`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| No direct select on shared_reports | SELECT | RESTRICTIVE | `false` |
| No direct insert on shared_reports | INSERT | RESTRICTIVE | `false` |
| No direct update on shared_reports | UPDATE | RESTRICTIVE | `false` |
| No direct delete on shared_reports | DELETE | RESTRICTIVE | `false` |

All access via SECURITY DEFINER RPCs: `create_shared_report`, `get_shared_report`. ✅ Strong isolation.

---

### 2.11 `test_prompts`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| test_prompts_select_admin | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |
| test_prompts_insert_admin | INSERT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** UPDATE, DELETE. ✅ Benchmarking data — append-only for admins.

---

### 2.12 `test_reports`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| test_reports_select_admin | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |
| test_reports_insert_admin | INSERT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** UPDATE, DELETE. FK: `prompt_id → test_prompts.id`. ✅

---

### 2.13 `user_roles`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Admins can read roles | SELECT | RESTRICTIVE | `has_role(auth.uid(), 'admin')` |

**Blocked:** INSERT, UPDATE, DELETE. ✅ Role assignment via service role only. FK: `user_id → auth.users.id` (CASCADE DELETE).

---

### 2.14 `validation_rules`

**Policies:**

| Policy | Command | Type | Expression |
|--------|---------|------|------------|
| Validation rules are publicly readable | SELECT | RESTRICTIVE | `true` |

**Blocked:** INSERT, UPDATE, DELETE. ✅ Managed via service role.

---

## 3. Security Definer Functions

| Function | Purpose | Auth Check | Notes |
|----------|---------|------------|-------|
| `has_role(_user_id, _role)` | Role lookup bypassing RLS | None (caller provides user_id) | Used in RLS expressions via `auth.uid()` |
| `create_shared_report(p_payload, p_expires_at)` | Insert shared report with server-side ID | None (SECURITY DEFINER) | 1MB payload limit, 128-bit random ID |
| `get_shared_report(p_share_id)` | Retrieve + opportunistic cleanup | None (SECURITY DEFINER) | Deletes expired rows on access |
| `save_intel_to_knowledge_base(...)` | Insert into `market_insights` | `auth.uid() IS NOT NULL` | Validates industry/category slugs required |
| `get_evolutionary_directives(limit_num)` | Aggregate shadow_log signals | None (SECURITY DEFINER) | Read-only aggregation from `test_reports` |

---

## 4. Risk Observations

### 4.1 `chat_feedback` — Broken Anonymous Insert

The INSERT policy requires `auth.uid() = user_id`, but `user_id` is nullable. For anonymous/unauthenticated users, `auth.uid()` returns NULL and `NULL = NULL` is false in SQL. **Anonymous feedback submission is effectively blocked.** 

**Impact:** Public chatbot users cannot submit feedback ratings.

**Recommendation:** Either:
- Change to PERMISSIVE with `WITH CHECK (true)` for anonymous insert, OR
- Change to `WITH CHECK (user_id IS NULL OR auth.uid() = user_id)` to allow both anonymous and authenticated inserts.

### 4.2 `saved_intel_configs` — Admin Override Defeated by RESTRICTIVE Semantics

All policies on this table use `Permissive: No` (RESTRICTIVE). PostgreSQL combines multiple RESTRICTIVE policies with AND. For SELECT, both "Users can select own configs" (`auth.uid() = user_id`) AND "Admins can read all configs" (`has_role(...)`) must pass. An admin who is NOT the config owner will fail the first policy → blocked.

**Impact:** Admin cannot view other users' saved configs despite explicit admin SELECT policy.

**Recommendation:** Change admin SELECT policy to PERMISSIVE, or consolidate into a single SELECT policy: `auth.uid() = user_id OR has_role(auth.uid(), 'admin')`.

### 4.3 `chat_feedback` — No Admin SELECT Policy

There is no SELECT policy on `chat_feedback`. Admins cannot read feedback data through normal Supabase client queries — only via service role key.

**Impact:** Founder Dashboard or admin analytics cannot query feedback without service role escalation.

### 4.4 `shared_reports` — No Expiry Enforcement Beyond Opportunistic Cleanup

Expired reports are only deleted when `get_shared_report` is called for that specific `share_id`. There is no background cleanup for reports that are never accessed after expiry.

**Impact:** Low — payload size is capped at 1MB, but stale data accumulates.

**Recommendation:** Add `pg_cron` job: `DELETE FROM shared_reports WHERE expires_at <= now()` (daily).

### 4.5 All RESTRICTIVE Policies — Deliberate Choice?

All RLS policies across the project use RESTRICTIVE (`Permissive: No`). This is the more secure default but requires careful attention when combining multiple policies on the same command (see §4.2). Single-policy tables are unaffected.

---

## 5. Recommendations

_Placeholder for security analyst review._

- [ ] Fix `chat_feedback` INSERT policy for anonymous access (§4.1)
- [ ] Fix `saved_intel_configs` admin SELECT override (§4.2)
- [ ] Add admin SELECT policy to `chat_feedback` (§4.3)
- [ ] Consider `pg_cron` cleanup for `shared_reports` (§4.4)
- [ ] Review RESTRICTIVE vs PERMISSIVE semantics across all multi-policy tables (§4.5)
- [ ] Validate `contact_submissions` INSERT with RESTRICTIVE + `true` works for anon role

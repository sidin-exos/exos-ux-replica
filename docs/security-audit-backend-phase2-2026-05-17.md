# Backend Security Audit — Phase 2 (Gateway, Webhooks & API) — Verification

**Date:** 2026-05-17
**Mode:** STRICT READ-ONLY.
**Scope:** `chat-copilot/`, `send-team-invite/`, `send-transactional-email/`, `stripe-webhook/`, `create-checkout-session/`, `create-portal-session/`, `preview-transactional-email/`, `_shared/validate.ts`.

---

## Task 1 — Production CORS & Scope Regressions

### 1.1 `chat-copilot/index.ts` — CONFIRMED OPEN (Critical, production-breaking)

`corsHeaders` is exported from `_shared/cors.ts` as a **function** `(req?: Request) => Record<string, string>`. `chat-copilot/index.ts` uses it as a bare identifier in 6 locations:

| Line | Usage | Effect |
|---|---|---|
| `153` | `return new Response(null, { headers: corsHeaders });` | Passes the function reference as `HeadersInit`. The `Response` constructor invokes `new Headers(fn)` which finds no own enumerable properties → preflight returns a response with **no CORS headers at all**. |
| `169` | `headers: { ...corsHeaders, "Content-Type": "application/json" }` | Spread of a function object → `{...fn}` is `{}` → only `Content-Type` is set; **no `Access-Control-Allow-Origin`, no `Vary`, no CSP, no `X-Content-Type-Options`**. |
| `192` | `{ ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": rateCheck.resetAt }` | Same pattern; rate-limit responses ship CORS-less. |
| `290` | `headers: { ...corsHeaders, "Content-Type": "application/json" }` | Success-path response. CORS-less. |
| `302` | `{ ...corsHeaders, "Content-Type": "application/json" }` | 429 rate-limit-from-Gemini response. CORS-less. |
| `328` | `{ ...corsHeaders, "Content-Type": "application/json" }` | Outer-catch error response. CORS-less. |

Every other in-scope function (`send-team-invite:94`, `create-checkout-session:7-77`, `create-portal-session:7-77`, `preview-transactional-email:12-105`, `send-transactional-email:56-…`, `validate.ts:28`) correctly **calls** `corsHeaders(req)`. `chat-copilot` is the lone holdout — bytewise unchanged since the 2026-05-17 backend audit (C1 from that report).

Net effect: a browser at `https://exosproc.com` calling `chat-copilot` will fail CORS preflight (line 153) and, even if preflight somehow succeeded, the actual response (line 290) has no `Access-Control-Allow-Origin` so the browser refuses to expose the body to scripts.

### 1.2 `send-team-invite/index.ts` `jsonResponse` — CONFIRMED OPEN (Critical, production-breaking)

**Lines 28-33:**
```ts
function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },   // ← req: ReferenceError
  });
}
```

`jsonResponse` is declared at **module scope** (line 28). The handler that owns `req` is declared at line 92 (`Deno.serve(async (req) => { ... })`). JavaScript scoping is lexical, not dynamic — `req` inside `jsonResponse` resolves through the module scope chain, where it is **not defined**. Result: every invocation of `jsonResponse` throws `ReferenceError: req is not defined`.

`jsonResponse` is called from **24 sites** inside the handler (lines 98, 104, 111, 120, 132, 176, 179, 191, 207, 240, 247, 252, 275, 278, 281, 284, 295, 325, 328, 351, 354, 357, 360, 369, 372, 375).

Every code path **except** the OPTIONS preflight at line 94 and the `rateLimitResponse(..., corsHeaders(req), …)` at line 139 will hit a `ReferenceError`. Result: the entire `send-team-invite` endpoint is non-functional for send/resend/revoke from a browser.

Audit C4 — bytewise unchanged.

---

## Task 2 — Stripe Webhook Idempotency (Audit Issue #7)

### Finding: CONFIRMED OPEN (High)

**File:** `supabase/functions/stripe-webhook/index.ts:50-150`

```ts
// Idempotency: insert event.id BEFORE applying side effects.
const { error: idempotencyError } = await admin
  .from("stripe_events")
  .insert({ id: event.id });                                  // ← line 57-59

if (idempotencyError) {
  if (idempotencyError.code === "23505") {
    console.log("[stripe-webhook] Event already processed", { … });
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200, …                                           // ← line 67-70 — short-circuit
    });
  }
  …
}

try {
  switch (event.type) {
    case "checkout.session.completed": {
      … await admin.from("profiles").update({ … }).eq("id", userId);   // ← line 92-100
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      …
      const { error } = userId
        ? await query.eq("id", userId)
        : await query.eq("stripe_customer_id", customerId);   // ← line 125-128

      if (error) {
        console.error("[stripe-webhook] profile update failed", error);   // ← only logs
      }
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, … });
} catch (err) {
  console.error("[stripe-webhook] handler error", err);
  return new Response(JSON.stringify({ error: "Webhook handler error" }), {
    status: 500,                                              // ← line 147-148
  });
}
```

Two distinct failure modes:

**Mode A — caught error returns 500, idempotency row already inserted.** If the switch's `await admin.…update(...)` throws, the outer `try/catch` returns 500. Stripe **retries**. The retry's idempotency insert hits `23505` and short-circuits with 200 OK at line 67-70, **without ever attempting the profile mutation again**. The subscription state drift is permanent.

**Mode B — silent error swallowing in `subscription.*` branch.** Lines 126-132 await the update and **only `console.error` on failure** — the handler returns 200 OK on line 141 anyway. Stripe sees success and never retries. If the profile update fails, the subscription row is permanently out of sync and the idempotency row prevents any future retry attempt.

Both modes occur because the idempotency marker is recorded **before** verifying the side effect succeeded. There is no `processed_at` flag on `stripe_events` — the table schema (per `supabase/migrations/20260512223418_create_stripe_events.sql`) is `(id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`. No "applied" column.

Audit issue #7 (H1) — bytewise unchanged.

---

## Task 3 — Unvalidated Stripe Redirects (Audit Issue #10)

### Finding: CONFIRMED OPEN (High) at both call sites

#### 3.1 `create-checkout-session/index.ts:50, 63-64`

```ts
const origin = req.headers.get("origin") ?? "https://exosproc.com";   // ← line 50

const session = await stripe.checkout.sessions.create({
  …
  success_url: `${origin}/account?checkout=success`,                   // ← line 63
  cancel_url:  `${origin}/pricing?checkout=cancelled`,                 // ← line 64
  …
});
```

`Origin` header is read verbatim and interpolated into `success_url` / `cancel_url`. **No regex check, no allowlist comparison, no scheme assertion.** A non-browser caller supplying `Origin: https://evil.example/` produces `success_url: "https://evil.example/account?checkout=success"`. After payment, Stripe redirects the user there.

#### 3.2 `create-portal-session/index.ts:68, 72`

```ts
const origin = req.headers.get("origin") ?? "https://exosproc.com";   // ← line 68

const portal = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${origin}/account`,                                     // ← line 72
});
```

Identical pattern; same vulnerability on the billing portal return URL.

`_shared/cors.ts` already contains `ALLOWED_ORIGIN_REGEX` that exactly fits this validation need, but neither file imports or uses it.

Audit issue #10 (H4) — bytewise unchanged.

---

## Task 4 — IP Spoofing in Rate Limiting (Audit Issues #11 & #16)

### 4.1 `chat-copilot/index.ts:174-180` — CONFIRMED OPEN

```ts
} else {
  // Anonymous: derive an identifier from the client IP for rate limiting.
  const fwd = req.headers.get("x-forwarded-for") || "";                         // ← line 176
  const ip = fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
  userId = `anon:${ip}`;
  isAnonymous = true;
}
```

- Reads `x-forwarded-for` directly from request headers — any caller can set it per request.
- `cf-connecting-ip` is the fallback — also a header, also forgeable.
- Result: an anonymous attacker rotates the header value per request and bypasses the 10/hour anonymous Gemini Pro rate limit (line 183) indefinitely → uncapped LLM cost burn.
- The function signature is `serve(async (req) => …)` — does **not** receive the second `info` argument, so the secure `Deno.serve(req, info).remoteAddr.hostname` pattern is unavailable until the handler signature is updated.

### 4.2 `preview-transactional-email/index.ts:36-44` — CONFIRMED OPEN

```ts
const clientIp =
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||                  // ← line 38
  req.headers.get('cf-connecting-ip') ||                                       // ← line 39
  'unknown'
const rateCheck = await checkRateLimit(clientIp, 'preview-transactional-email', 60, 60)
```

Same pattern. Lower practical risk because the endpoint is gated by `LOVABLE_API_KEY` (lines 27-34) — but the rate limit itself is forgeable, defeating defence-in-depth.

Audit issues #11 (H5) and #16 (H7) — both bytewise unchanged.

---

## Task 5 — Unauthorized Phishing Vector via `send-transactional-email` (Audit Issue #12)

### Finding: CONFIRMED OPEN (High) — admin check is missing

**File:** `supabase/functions/send-transactional-email/index.ts:53-198`

The full authorization model (lines 173-198):

```ts
if (!template.to) {
  const isAllowlisted = RECIPIENT_ALLOWLIST.has(effectiveRecipient.toLowerCase())
  if (!isAllowlisted) {
    // Require authentication for non-allowlisted recipients
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required for this template' }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { error: authError } = await authClient.auth.getUser(token)
    if (authError) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }
  }
}
```

`RECIPIENT_ALLOWLIST` (lines 38-41) contains only `contact@exosproc.com` and `support@exosproc.com`. For any non-allowlisted recipient, the **only** auth requirement is "a valid JWT".

There is **no `requireAdmin(userId)` call** anywhere in this file. Verified by grepping `requireAdmin` against the directory: zero matches. The function says "Require authentication" — but **any logged-in user** (free tier, brand-new account, no admin role) satisfies the check.

**Exploit shape (any authenticated EXOS user):**
```bash
curl -X POST https://<project>.supabase.co/functions/v1/send-transactional-email \
  -H "Authorization: Bearer <any-user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "team-invite",
    "recipientEmail": "victim@target-company.com",
    "templateData": {
      "inviterName": "Boris Johnson",
      "organizationName": "Target Company Ltd",
      "role": "admin",
      "inviteUrl": "https://exosproc.com/auth?invite=<attacker-controlled-uuid>",
      "expiresInDays": 7
    }
  }'
```

Sender: `notify.exosproc.com` (verified domain, line 14). Subject and HTML body: rendered by the `team-invite` React Email template. The recipient sees a brand-correct, DKIM-signed invitation. The `inviteUrl` token is attacker-controlled; the brand-real envelope is the entire point of the phishing vector.

The comment at the top of `send-team-invite/index.ts:14-17` documents the **intended** flow (admin-gates → forwards JWT to satisfy this endpoint's auth check), but does **not** enforce it. `send-transactional-email` cannot tell whether the caller went through `send-team-invite` or hit the function directly — no `X-Internal-Source` HMAC, no service-token check.

Audit issue #12 (H6) — bytewise unchanged.

---

## Task 6 — Validation Helper Signature (Audit Issue #23)

### Finding: CONFIRMED OPEN (Medium) — `req` is optional and never passed

**File:** `supabase/functions/_shared/validate.ts:25-30`

```ts
export function validationErrorResponse(message: string, req?: Request): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
  );
}
```

`req` is optional. When omitted, `corsHeaders(undefined)` falls back to `DEFAULT_ORIGIN` = `"https://exosproc.com"` (per `_shared/cors.ts:22, 36`).

The signature is **never used with the `req` argument** in any of the in-scope Phase 2 files:

| File | Line | Call |
|---|---|---|
| `chat-copilot/index.ts` | 315 | `return validationErrorResponse(error.message);` |
| `send-team-invite/index.ts` | 131 | `if (e instanceof ValidationError) return validationErrorResponse(e.message);` |
| `send-team-invite/index.ts` | 159 | `if (e instanceof ValidationError) return validationErrorResponse(e.message);` |
| `send-team-invite/index.ts` | 164 | `return validationErrorResponse("Invalid email address");` |
| `send-team-invite/index.ts` | 261 | `if (e instanceof ValidationError) return validationErrorResponse(e.message);` |
| `send-team-invite/index.ts` | 265 | `return validationErrorResponse("Invalid invitationId");` |
| `send-team-invite/index.ts` | 337 | `if (e instanceof ValidationError) return validationErrorResponse(e.message);` |
| `send-team-invite/index.ts` | 341 | `return validationErrorResponse("Invalid invitationId");` |

All 8 calls omit `req`. Every validation-error response therefore carries `Access-Control-Allow-Origin: https://exosproc.com` regardless of the caller's actual `Origin` header. Validation errors returned to Vercel preview / `localhost` callers will have a mismatched ACAO and the browser will refuse to expose the response body to scripts.

Audit issue #23 (M7) — bytewise unchanged.

---

## Status Matrix — Phase 2 (Backend)

| Audit ID | Finding | Status |
|---|---|---|
| **#1 / C1** | `chat-copilot` uses `corsHeaders` as a static object instead of `corsHeaders(req)` — production-breaking | **CONFIRMED OPEN — Critical** |
| **#4 / C4** | `send-team-invite` `jsonResponse` references `req` from module scope → `ReferenceError` on every call | **CONFIRMED OPEN — Critical** |
| **#7 / H1** | Stripe webhook inserts `stripe_events` row before mutation; retry blocked + silent failure on async error | **CONFIRMED OPEN — High** |
| **#10 / H4** | `Origin` header trusted verbatim in Stripe `success_url`/`cancel_url`/`return_url` | **CONFIRMED OPEN — High** |
| **#11 / H5** | `chat-copilot` anonymous rate-limit key uses spoofable `x-forwarded-for` | **CONFIRMED OPEN — High** |
| **#16 / H7** | `preview-transactional-email` rate-limit key uses spoofable `x-forwarded-for` | **CONFIRMED OPEN — Low/Med** (LOVABLE_API_KEY gates the endpoint) |
| **#12 / H6** | `send-transactional-email` accepts any authenticated JWT for non-allowlisted recipients; brand-real phishing vector | **CONFIRMED OPEN — High** |
| **#23 / M7** | `validationErrorResponse(message, req?)` — `req` optional, never passed | **CONFIRMED OPEN — Medium** |

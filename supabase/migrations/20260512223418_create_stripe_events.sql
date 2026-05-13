-- ============================================================
-- Security Audit Fix #5 — Stripe Webhook Idempotency
-- ============================================================
-- Stripe webhooks can be retried (on any 5xx, network error, or
-- timeout) and the signature toleration window allows replay of
-- a captured payload within ~5 minutes. Without an idempotency
-- check, the same `customer.subscription.updated` event could be
-- replayed after a `customer.subscription.deleted`, flipping the
-- profile back to `active`.
--
-- The stripe-webhook edge function performs an INSERT into this
-- table BEFORE applying any side effects. The PRIMARY KEY on
-- event.id raises a unique-violation on replay, which the function
-- catches and short-circuits with 200 OK.
-- ============================================================

CREATE TABLE public.stripe_events (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No policies: only the service_role (used by the stripe-webhook
-- edge function) accesses this table. RLS-on with zero policies
-- denies all anon / authenticated access by default.

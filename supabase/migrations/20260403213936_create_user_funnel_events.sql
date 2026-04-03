-- =============================================================
-- Funnel tracking: user_funnel_events table, trigger, and views
-- =============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.user_funnel_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      UUID,
  event_name      TEXT NOT NULL,
  cohort          TEXT,
  country         TEXT,
  checkpoint      TEXT,
  properties      JSONB DEFAULT '{}',
  source          TEXT DEFAULT 'edge_fn'
);

ALTER TABLE public.user_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own events" ON public.user_funnel_events
  FOR SELECT USING (auth.uid() = user_id);

-- Performance indexes for dedup queries (trackOnceEvent / trackDailyEvent)
CREATE INDEX idx_funnel_user_event ON public.user_funnel_events (user_id, event_name);
CREATE INDEX idx_funnel_user_event_created ON public.user_funnel_events (user_id, event_name, created_at);

-- 2. Trigger: auto-insert user_signed_up on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user_funnel()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_funnel_events (user_id, event_name, checkpoint, properties, source)
  VALUES (NEW.id, 'user_signed_up', 'CP1', '{"plan":"free"}'::jsonb, 'trigger');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_funnel ON auth.users;
CREATE TRIGGER on_auth_user_created_funnel
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_funnel();

-- 3. Monitoring views

CREATE OR REPLACE VIEW public.v_funnel_overview AS
SELECT
  cohort,
  COUNT(DISTINCT CASE WHEN event_name = 'user_signed_up' THEN user_id END) AS signed_up,
  COUNT(DISTINCT CASE WHEN event_name = 'first_action_completed' THEN user_id END) AS activated,
  COUNT(DISTINCT CASE WHEN event_name = 'report_generated' THEN user_id END) AS generated_report,
  COUNT(DISTINCT CASE WHEN event_name = 'paywall_reached' THEN user_id END) AS hit_paywall,
  COUNT(DISTINCT CASE WHEN event_name = 'subscription_started' THEN user_id END) AS paid,
  COUNT(DISTINCT CASE WHEN event_name = 'session_returned' THEN user_id END) AS retained_week3
FROM public.user_funnel_events
GROUP BY cohort ORDER BY cohort;

CREATE OR REPLACE VIEW public.v_checkpoint_dropoff AS
SELECT
  cohort,
  COUNT(DISTINCT CASE WHEN event_name = 'user_signed_up' AND user_id NOT IN (SELECT user_id FROM public.user_funnel_events WHERE event_name = 'first_action_completed') THEN user_id END) AS stuck_at_cp3_onboarding,
  COUNT(DISTINCT CASE WHEN event_name = 'first_action_completed' AND user_id NOT IN (SELECT user_id FROM public.user_funnel_events WHERE event_name = 'report_generated') THEN user_id END) AS stuck_at_cp4_value,
  COUNT(DISTINCT CASE WHEN event_name = 'report_generated' AND user_id NOT IN (SELECT user_id FROM public.user_funnel_events WHERE event_name = 'paywall_reached') THEN user_id END) AS no_upgrade_intent,
  COUNT(DISTINCT CASE WHEN event_name = 'paywall_reached' AND user_id NOT IN (SELECT user_id FROM public.user_funnel_events WHERE event_name = 'subscription_started') THEN user_id END) AS stuck_at_cp5_pricing,
  COUNT(DISTINCT CASE WHEN event_name = 'subscription_started' AND user_id NOT IN (SELECT user_id FROM public.user_funnel_events WHERE event_name = 'session_returned') THEN user_id END) AS stuck_at_cp6_retention
FROM public.user_funnel_events
GROUP BY cohort ORDER BY cohort;

CREATE OR REPLACE VIEW public.v_user_journey AS
SELECT
  u.user_id, u.cohort, u.country, u.created_at AS signed_up_at,
  DATE_PART('day', NOW() - u.created_at) AS days_since_signup,
  MAX(e.created_at) AS last_seen,
  COUNT(DISTINCT e.event_name) AS distinct_events_fired,
  MAX(CASE WHEN e.event_name = 'first_action_completed' THEN 1 ELSE 0 END) AS activated,
  MAX(CASE WHEN e.event_name = 'report_generated' THEN 1 ELSE 0 END) AS generated_report,
  MAX(CASE WHEN e.event_name = 'paywall_reached' THEN 1 ELSE 0 END) AS hit_paywall,
  MAX(CASE WHEN e.event_name = 'subscription_started' THEN 1 ELSE 0 END) AS is_paid,
  MAX(CASE WHEN e.event_name = 'session_returned' THEN 1 ELSE 0 END) AS returned_week3
FROM (SELECT DISTINCT user_id, cohort, country, created_at FROM public.user_funnel_events WHERE event_name = 'user_signed_up') u
LEFT JOIN public.user_funnel_events e ON e.user_id = u.user_id
GROUP BY u.user_id, u.cohort, u.country, u.created_at
ORDER BY signed_up_at DESC;

CREATE OR REPLACE VIEW public.v_weekly_cohort_health AS
SELECT
  cohort,
  DATE_TRUNC('week', created_at) AS week,
  COUNT(DISTINCT CASE WHEN event_name = 'user_signed_up' THEN user_id END) AS new_signups,
  COUNT(DISTINCT CASE WHEN event_name = 'first_action_completed' THEN user_id END) AS activations,
  COUNT(DISTINCT CASE WHEN event_name = 'report_generated' THEN user_id END) AS reports_generated,
  COUNT(DISTINCT CASE WHEN event_name = 'subscription_started' THEN user_id END) AS new_paid
FROM public.user_funnel_events
GROUP BY cohort, DATE_TRUNC('week', created_at)
ORDER BY week DESC, cohort;

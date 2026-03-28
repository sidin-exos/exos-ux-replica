
-- ============================================================
-- Inflation Platform v2.0 — Price Driver Framework tables
-- ============================================================

-- 1. inflation_trackers
CREATE TABLE public.inflation_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goods_definition text NOT NULL,
  driver_count_target integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inflation_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org" ON public.inflation_trackers
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_in_org" ON public.inflation_trackers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_in_org" ON public.inflation_trackers
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_in_org" ON public.inflation_trackers
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE TRIGGER auto_set_org_inflation_trackers
  BEFORE INSERT ON public.inflation_trackers
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

-- 2. inflation_drivers
CREATE TABLE public.inflation_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL REFERENCES public.inflation_trackers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_name text NOT NULL,
  rationale text,
  source text NOT NULL DEFAULT 'ai_proposed',
  weight integer,
  trigger_description text,
  scan_cadence text NOT NULL DEFAULT 'weekly',
  enrichment_cadence text NOT NULL DEFAULT 'monthly',
  current_status text NOT NULL DEFAULT 'stable',
  context_summary text,
  last_scanned_at timestamptz,
  last_enriched_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inflation_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org" ON public.inflation_drivers
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_in_org" ON public.inflation_drivers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_in_org" ON public.inflation_drivers
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_in_org" ON public.inflation_drivers
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE TRIGGER auto_set_org_inflation_drivers
  BEFORE INSERT ON public.inflation_drivers
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

-- Validation trigger for current_status
CREATE OR REPLACE FUNCTION public.validate_driver_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.current_status NOT IN ('improving', 'stable', 'deteriorating') THEN
    RAISE EXCEPTION 'Invalid driver status: %. Must be improving, stable, or deteriorating.', NEW.current_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_driver_status_trigger
  BEFORE INSERT OR UPDATE ON public.inflation_drivers
  FOR EACH ROW EXECUTE FUNCTION public.validate_driver_status();

-- 3. inflation_event_scans
CREATE TABLE public.inflation_event_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.inflation_drivers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_date date NOT NULL DEFAULT CURRENT_DATE,
  event_detected boolean NOT NULL DEFAULT false,
  confidence_level text,
  source_summary text,
  source_urls text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inflation_event_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org" ON public.inflation_event_scans
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_in_org" ON public.inflation_event_scans
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- 4. inflation_alerts
CREATE TABLE public.inflation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.inflation_drivers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_source text NOT NULL,
  alert_level text NOT NULL,
  scan_id uuid REFERENCES public.inflation_event_scans(id) ON DELETE SET NULL,
  bridge_scenarios text[],
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inflation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org" ON public.inflation_alerts
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_in_org" ON public.inflation_alerts
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

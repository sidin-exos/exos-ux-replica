-- inflation_trackers
DROP POLICY IF EXISTS select_in_org ON public.inflation_trackers;
DROP POLICY IF EXISTS update_in_org ON public.inflation_trackers;
DROP POLICY IF EXISTS delete_in_org ON public.inflation_trackers;

CREATE POLICY select_own_or_admin_in_org ON public.inflation_trackers
  FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (auth.uid() = created_by OR is_org_admin(auth.uid()))
    )
  );

CREATE POLICY update_own_in_org ON public.inflation_trackers
  FOR UPDATE
  USING (auth.uid() = created_by AND organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (auth.uid() = created_by AND organization_id = get_user_org_id(auth.uid()));

CREATE POLICY delete_own_in_org ON public.inflation_trackers
  FOR DELETE
  USING (auth.uid() = created_by AND organization_id = get_user_org_id(auth.uid()));

-- inflation_drivers (derive ownership via parent tracker)
DROP POLICY IF EXISTS select_in_org ON public.inflation_drivers;
DROP POLICY IF EXISTS update_in_org ON public.inflation_drivers;
DROP POLICY IF EXISTS delete_in_org ON public.inflation_drivers;

CREATE POLICY select_own_or_admin_in_org ON public.inflation_drivers
  FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.inflation_trackers t
      WHERE t.id = inflation_drivers.tracker_id
        AND t.organization_id = get_user_org_id(auth.uid())
        AND (auth.uid() = t.created_by OR is_org_admin(auth.uid()))
    )
  );

CREATE POLICY update_own_in_org ON public.inflation_drivers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.inflation_trackers t
      WHERE t.id = inflation_drivers.tracker_id
        AND t.created_by = auth.uid()
        AND t.organization_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inflation_trackers t
      WHERE t.id = inflation_drivers.tracker_id
        AND t.created_by = auth.uid()
        AND t.organization_id = get_user_org_id(auth.uid())
    )
  );

CREATE POLICY delete_own_in_org ON public.inflation_drivers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.inflation_trackers t
      WHERE t.id = inflation_drivers.tracker_id
        AND t.created_by = auth.uid()
        AND t.organization_id = get_user_org_id(auth.uid())
    )
  );
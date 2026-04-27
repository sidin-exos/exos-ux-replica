-- Broaden project_files INSERT/UPDATE/DELETE policies so super-admins (and org admins)
-- can manage attachments on behalf of project owners.

DROP POLICY IF EXISTS insert_own_in_org ON public.project_files;
DROP POLICY IF EXISTS delete_own_or_admin_in_org ON public.project_files;

CREATE POLICY insert_own_in_org
ON public.project_files
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    organization_id = get_user_org_id(auth.uid())
    AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
  )
);

CREATE POLICY delete_own_or_admin_in_org
ON public.project_files
FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (
    organization_id = get_user_org_id(auth.uid())
    AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
  )
);
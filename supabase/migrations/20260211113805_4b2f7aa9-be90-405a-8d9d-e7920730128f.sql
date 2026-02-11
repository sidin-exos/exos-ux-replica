
-- Remove public SELECT policies
DROP POLICY IF EXISTS "test_prompts_select_public" ON public.test_prompts;
DROP POLICY IF EXISTS "test_reports_select_public" ON public.test_reports;

-- Add admin-only SELECT policies
CREATE POLICY "test_prompts_select_admin"
ON public.test_prompts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "test_reports_select_admin"
ON public.test_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Also restrict INSERT to admin only (replace the open authenticated insert)
DROP POLICY IF EXISTS "test_prompts_insert_authenticated" ON public.test_prompts;
DROP POLICY IF EXISTS "test_reports_insert_authenticated" ON public.test_reports;

CREATE POLICY "test_prompts_insert_admin"
ON public.test_prompts
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "test_reports_insert_admin"
ON public.test_reports
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

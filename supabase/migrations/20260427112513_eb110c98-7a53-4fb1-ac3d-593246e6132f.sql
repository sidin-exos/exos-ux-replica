-- Projects: reusable context bundles (description + files) usable across scenarios
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org"
ON public.projects FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR organization_id = public.get_user_org_id(auth.uid())
);

CREATE POLICY "insert_own_in_org"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND organization_id = public.get_user_org_id(auth.uid())
);

CREATE POLICY "update_own_or_admin_in_org"
ON public.projects FOR UPDATE TO authenticated
USING (
  organization_id = public.get_user_org_id(auth.uid())
  AND (auth.uid() = user_id OR public.is_org_admin(auth.uid()))
)
WITH CHECK (
  organization_id = public.get_user_org_id(auth.uid())
  AND (auth.uid() = user_id OR public.is_org_admin(auth.uid()))
);

CREATE POLICY "delete_own_or_admin_in_org"
ON public.projects FOR DELETE TO authenticated
USING (
  organization_id = public.get_user_org_id(auth.uid())
  AND (auth.uid() = user_id OR public.is_org_admin(auth.uid()))
);

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_projects_user ON public.projects(user_id);

-- Project files: link a project to one or more files in user_files
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  attached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, file_id)
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_in_org"
ON public.project_files FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR organization_id = public.get_user_org_id(auth.uid())
);

CREATE POLICY "insert_own_in_org"
ON public.project_files FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND organization_id = public.get_user_org_id(auth.uid())
);

CREATE POLICY "delete_own_or_admin_in_org"
ON public.project_files FOR DELETE TO authenticated
USING (
  organization_id = public.get_user_org_id(auth.uid())
  AND (auth.uid() = user_id OR public.is_org_admin(auth.uid()))
);

CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_files_file ON public.project_files(file_id);

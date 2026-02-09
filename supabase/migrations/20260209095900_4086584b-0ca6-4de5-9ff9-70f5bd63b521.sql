
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS: only admins can read user_roles
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Seed admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('5e31324d-ae8d-4abc-91dd-dd493138bc25', 'admin');

-- 6. Founder metrics table
CREATE TABLE public.founder_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mrr numeric NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  burn_rate numeric NOT NULL DEFAULT 0,
  runway_months integer NOT NULL DEFAULT 12,
  strategic_hypothesis text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_metrics ENABLE ROW LEVEL SECURITY;

-- 7. RLS for founder_metrics
CREATE POLICY "Admins can select founder_metrics"
  ON public.founder_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert founder_metrics"
  ON public.founder_metrics FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update founder_metrics"
  ON public.founder_metrics FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Auto-update trigger
CREATE TRIGGER update_founder_metrics_updated_at
  BEFORE UPDATE ON public.founder_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Seed initial metrics row
INSERT INTO public.founder_metrics (mrr, active_users, burn_rate, runway_months, strategic_hypothesis)
VALUES (0, 0, 0, 12, 'We believe that adding Team Features will unlock Enterprise tier (EUR500/mo).');

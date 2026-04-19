-- Team invite flow: org_invitations table + profiles.email denormalization

-- 1. Denormalize email onto profiles so admins can list team members without
--    joining auth.users (which is not readable via PostgREST/RLS from clients).
--    Populated by handle_new_user trigger on signup; backfilled here for existing rows.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));

-- 2. Org invitations table
CREATE TABLE public.org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'user',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Only one active pending invite per (org, email). Re-invite after revoke/expire is allowed.
CREATE UNIQUE INDEX idx_unique_pending_invite
  ON public.org_invitations (organization_id, lower(invitee_email))
  WHERE status = 'pending';

CREATE INDEX idx_org_invitations_token
  ON public.org_invitations (token) WHERE status = 'pending';

CREATE INDEX idx_org_invitations_org
  ON public.org_invitations (organization_id, status);

ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can see invitations for their own org. Super admins see everything.
CREATE POLICY "org_admins_select_invitations" ON public.org_invitations
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_org_id(auth.uid()) AND is_org_admin(auth.uid()))
  );

-- Admins can insert invitations for their own org; inviter_id must be themselves.
CREATE POLICY "org_admins_insert_invitations" ON public.org_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND is_org_admin(auth.uid())
    AND inviter_id = auth.uid()
  );

-- Admins can update (e.g., revoke, extend expiry) invitations in their org.
CREATE POLICY "org_admins_update_invitations" ON public.org_invitations
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_org_id(auth.uid()) AND is_org_admin(auth.uid()))
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_org_id(auth.uid()) AND is_org_admin(auth.uid()))
  );

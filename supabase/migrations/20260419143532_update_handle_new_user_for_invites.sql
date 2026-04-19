-- Extend handle_new_user to honor invite tokens passed via raw_user_meta_data.
-- When a valid token exists (pending, unexpired, email match), the new user
-- joins the inviter's organization with the invited role instead of
-- auto-creating a personal organization.
--
-- Preserves the full 11-field insert from the current function for the
-- non-invite branch, and additionally populates the new profiles.email column.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display_name TEXT;
  _org_id UUID;
  _invite_token UUID;
  _invitation public.org_invitations%ROWTYPE;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Invite branch: parse the token safely (malformed UUIDs fall through).
  BEGIN
    _invite_token := NULLIF(NEW.raw_user_meta_data->>'invite_token', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    _invite_token := NULL;
  END;

  IF _invite_token IS NOT NULL THEN
    SELECT * INTO _invitation
    FROM public.org_invitations
    WHERE token = _invite_token
      AND status = 'pending'
      AND expires_at > NOW()
      AND lower(invitee_email) = lower(NEW.email)
    FOR UPDATE;

    IF FOUND THEN
      INSERT INTO public.profiles (
        id, email, display_name, organization_id, role,
        full_name, job_title
      )
      VALUES (
        NEW.id,
        NEW.email,
        _display_name,
        _invitation.organization_id,
        _invitation.role,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'job_title'
      );

      UPDATE public.org_invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = _invitation.id;

      RETURN NEW;
    END IF;
    -- Token invalid / expired / email mismatch: fall through to normal signup.
  END IF;

  -- Normal signup: create a personal organization and admin profile.
  INSERT INTO public.organizations (name)
  VALUES (_display_name || '''s Organization')
  RETURNING id INTO _org_id;

  INSERT INTO public.profiles (
    id, email, display_name, organization_id, role,
    full_name, job_title, company_name, company_size,
    country, industry, primary_challenge
  )
  VALUES (
    NEW.id,
    NEW.email,
    _display_name,
    _org_id,
    'admin',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'job_title',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_size',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'industry',
    NEW.raw_user_meta_data->>'primary_challenge'
  );

  RETURN NEW;
END;
$$;

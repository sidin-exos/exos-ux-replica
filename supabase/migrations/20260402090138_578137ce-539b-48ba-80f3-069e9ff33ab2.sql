
-- Add registration-sourced columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS primary_challenge text;

-- Update handle_new_user to populate new fields from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _display_name TEXT;
  _org_id UUID;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Create personal organization
  INSERT INTO public.organizations (name)
  VALUES (_display_name || '''s Organization')
  RETURNING id INTO _org_id;

  -- Create profile as admin of new org, including registration fields
  INSERT INTO public.profiles (
    id, display_name, organization_id, role,
    full_name, job_title, company_name, company_size,
    country, industry, primary_challenge
  )
  VALUES (
    NEW.id,
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
$function$;

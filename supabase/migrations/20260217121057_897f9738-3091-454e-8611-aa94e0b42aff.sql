
-- 1. Replace create_shared_report: generate share_id server-side, add payload size limit
CREATE OR REPLACE FUNCTION public.create_shared_report(
  p_payload jsonb,
  p_expires_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id text;
BEGIN
  -- Validate payload size (1MB limit)
  IF octet_length(p_payload::text) > 1048576 THEN
    RAISE EXCEPTION 'Payload too large (max 1MB)';
  END IF;

  -- Generate cryptographically secure share_id server-side
  v_share_id := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.shared_reports (share_id, payload, expires_at)
  VALUES (v_share_id, p_payload, p_expires_at);

  RETURN v_share_id;
END;
$$;

-- 2. Revoke anonymous access, keep authenticated only
REVOKE EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) TO authenticated;

-- 3. Drop the old 3-param overload so anon grant is fully removed
DROP FUNCTION IF EXISTS public.create_shared_report(text, jsonb, timestamptz);

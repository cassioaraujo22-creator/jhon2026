-- Public onboarding config for unauthenticated app screens.
-- This keeps onboarding customizable by admin while still available before login.

CREATE OR REPLACE FUNCTION public.get_public_onboarding_config()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gym_row public.gyms%ROWTYPE;
BEGIN
  SELECT *
  INTO gym_row
  FROM public.gyms
  ORDER BY created_at ASC
  LIMIT 1;

  IF gym_row.id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'gym_id', gym_row.id,
    'gym_name', gym_row.name,
    'accent_color', gym_row.accent_color,
    'settings', COALESCE(gym_row.settings, '{}'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_onboarding_config() TO anon, authenticated;

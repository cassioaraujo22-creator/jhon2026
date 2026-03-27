
CREATE OR REPLACE FUNCTION public.find_profile_by_email(_email text)
RETURNS TABLE(id uuid, gym_id uuid, name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.gym_id, p.name, p.email
  FROM public.profiles p
  WHERE p.email = _email
  LIMIT 1;
$$;


-- Update handle_new_user to auto-assign gym, role, and membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _gym_id uuid;
BEGIN
  -- Get the single gym
  SELECT id INTO _gym_id FROM public.gyms LIMIT 1;

  -- Create profile linked to the gym
  INSERT INTO public.profiles (id, name, email, gym_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    _gym_id
  );

  -- Assign member role
  IF _gym_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, gym_id, role)
    VALUES (NEW.id, _gym_id, 'member');

    -- Create active membership
    INSERT INTO public.memberships (member_id, gym_id, status)
    VALUES (NEW.id, _gym_id, 'active');
  END IF;

  RETURN NEW;
END;
$$;

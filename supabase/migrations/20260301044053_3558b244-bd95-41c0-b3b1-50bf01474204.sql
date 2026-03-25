
-- Confirm email
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE id = '5596ac61-5ce2-429e-816b-c8a7c6365824';

-- Create default gym
INSERT INTO public.gyms (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'FitPro Academy', 'fitpro');

-- Link profile to gym
UPDATE public.profiles
SET gym_id = '00000000-0000-0000-0000-000000000001'
WHERE id = '5596ac61-5ce2-429e-816b-c8a7c6365824';

-- Assign owner role
INSERT INTO public.user_roles (user_id, gym_id, role)
VALUES ('5596ac61-5ce2-429e-816b-c8a7c6365824', '00000000-0000-0000-0000-000000000001', 'owner');

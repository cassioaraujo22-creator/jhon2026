-- Fix RLS for trainer visibility on student home.
-- Previous policy queried user_roles directly, which is blocked for members by user_roles RLS.
-- Replace with SECURITY DEFINER role checks.
DROP POLICY IF EXISTS "Members see gym coaches" ON public.profiles;

CREATE POLICY "Members see gym coaches"
ON public.profiles
FOR SELECT
USING (
  gym_id = get_user_gym_id(auth.uid())
  AND (
    has_gym_role(profiles.id, profiles.gym_id, 'coach'::app_role)
    OR has_gym_role(profiles.id, profiles.gym_id, 'owner'::app_role)
  )
);
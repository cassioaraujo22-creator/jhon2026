
-- Allow members to see coach/owner profiles in their gym (for trainer card on home)
CREATE POLICY "Members see gym coaches"
ON public.profiles
FOR SELECT
USING (
  gym_id = get_user_gym_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = profiles.id
      AND gym_id = profiles.gym_id
      AND role IN ('coach', 'owner')
  )
);

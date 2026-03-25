-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Gym members see coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Staff manages coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches update own profile" ON public.coach_profiles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Gym members see coach profiles"
  ON public.coach_profiles
  FOR SELECT
  TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()));

CREATE POLICY "Staff manages coach profiles"
  ON public.coach_profiles
  FOR ALL
  TO authenticated
  USING (is_gym_staff(auth.uid(), gym_id))
  WITH CHECK (is_gym_staff(auth.uid(), gym_id));

CREATE POLICY "Coaches update own profile"
  ON public.coach_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
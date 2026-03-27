-- Allow nutritionists to read members for diet assignment flows

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Nutrition staff sees gym profiles'
  ) THEN
    DROP POLICY "Nutrition staff sees gym profiles" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Nutrition staff sees gym profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_gym_nutrition_staff(auth.uid(), gym_id));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'memberships'
      AND policyname = 'Nutrition staff sees memberships'
  ) THEN
    DROP POLICY "Nutrition staff sees memberships" ON public.memberships;
  END IF;
END $$;

CREATE POLICY "Nutrition staff sees memberships"
  ON public.memberships
  FOR SELECT
  TO authenticated
  USING (public.is_gym_nutrition_staff(auth.uid(), gym_id));

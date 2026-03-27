-- ============================================================
-- Nutrition module: recipes, diets, assignments + seed
-- ============================================================

-- 1) Role for nutrition staff
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nutritionist';

-- 2) Helper function for nutrition permissions
CREATE OR REPLACE FUNCTION public.is_gym_nutrition_staff(_user_id UUID, _gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND gym_id = _gym_id
      AND role IN ('owner', 'nutritionist')
  )
  OR public.has_role(_user_id, 'super_admin')
$$;

-- 3) Core tables
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe_da_manha', 'almoco', 'jantar', 'lanche', 'ceia')),
  prep_time_minutes INT,
  calories INT NOT NULL DEFAULT 0,
  protein_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diet_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  meal_order INT NOT NULL DEFAULT 0,
  scheduled_time TEXT,
  UNIQUE(diet_id, recipe_id, meal_order)
);

CREATE TABLE IF NOT EXISTS public.student_diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diet_id UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
  notes TEXT,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_gym_active ON public.recipes(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_diets_gym_active ON public.diets(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_diet_recipes_diet ON public.diet_recipes(diet_id, meal_order);
CREATE INDEX IF NOT EXISTS idx_student_diets_student_status ON public.student_diets(student_id, status, starts_at);
CREATE INDEX IF NOT EXISTS idx_student_diets_gym_status ON public.student_diets(gym_id, status);

DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_diets_updated_at ON public.diets;
CREATE TRIGGER update_diets_updated_at
  BEFORE UPDATE ON public.diets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_student_diets_updated_at ON public.student_diets;
CREATE TRIGGER update_student_diets_updated_at
  BEFORE UPDATE ON public.student_diets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_diets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutrition staff manages recipes" ON public.recipes;
CREATE POLICY "Nutrition staff manages recipes"
  ON public.recipes FOR ALL
  TO authenticated
  USING (public.is_gym_nutrition_staff(auth.uid(), gym_id))
  WITH CHECK (public.is_gym_nutrition_staff(auth.uid(), gym_id));

DROP POLICY IF EXISTS "Gym members see active recipes" ON public.recipes;
CREATE POLICY "Gym members see active recipes"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Nutrition staff manages diets" ON public.diets;
CREATE POLICY "Nutrition staff manages diets"
  ON public.diets FOR ALL
  TO authenticated
  USING (public.is_gym_nutrition_staff(auth.uid(), gym_id))
  WITH CHECK (public.is_gym_nutrition_staff(auth.uid(), gym_id));

DROP POLICY IF EXISTS "Gym members see active diets" ON public.diets;
CREATE POLICY "Gym members see active diets"
  ON public.diets FOR SELECT
  TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Nutrition staff manages diet recipes" ON public.diet_recipes;
CREATE POLICY "Nutrition staff manages diet recipes"
  ON public.diet_recipes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.diets d
      WHERE d.id = diet_recipes.diet_id
        AND public.is_gym_nutrition_staff(auth.uid(), d.gym_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.diets d
      WHERE d.id = diet_recipes.diet_id
        AND public.is_gym_nutrition_staff(auth.uid(), d.gym_id)
    )
  );

DROP POLICY IF EXISTS "Gym members see diet recipes from own gym" ON public.diet_recipes;
CREATE POLICY "Gym members see diet recipes from own gym"
  ON public.diet_recipes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.diets d
      WHERE d.id = diet_recipes.diet_id
        AND d.gym_id = public.get_user_gym_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Nutrition staff manages student diets" ON public.student_diets;
CREATE POLICY "Nutrition staff manages student diets"
  ON public.student_diets FOR ALL
  TO authenticated
  USING (public.is_gym_nutrition_staff(auth.uid(), gym_id))
  WITH CHECK (public.is_gym_nutrition_staff(auth.uid(), gym_id));

DROP POLICY IF EXISTS "Students see own diet assignments" ON public.student_diets;
CREATE POLICY "Students see own diet assignments"
  ON public.student_diets FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 5) Seed: 5 demo recipes (first gym)
DO $$
DECLARE
  _gym_id UUID;
BEGIN
  SELECT id INTO _gym_id FROM public.gyms LIMIT 1;
  IF _gym_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.recipes (
    gym_id, title, description, meal_type, prep_time_minutes, calories, protein_g, carbs_g, fat_g, ingredients, steps, image_url, is_active
  ) VALUES
  (
    _gym_id,
    'Overnight Oats Proteico',
    'Aveia com iogurte e whey para um café da manhã prático.',
    'cafe_da_manha',
    10,
    320, 24, 38, 8,
    '["40g de aveia", "170g de iogurte natural", "1 scoop de whey", "1 colher de chia", "frutas vermelhas"]'::jsonb,
    '["Misture aveia, iogurte e whey.", "Leve à geladeira por 6-8h.", "Finalize com chia e frutas."]'::jsonb,
    'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    _gym_id,
    'Frango Grelhado com Batata Doce',
    'Refeição clássica para ganho de massa e energia sustentada.',
    'almoco',
    30,
    480, 42, 45, 12,
    '["180g de peito de frango", "200g de batata doce", "azeite", "sal e pimenta"]'::jsonb,
    '["Tempere e grelhe o frango.", "Asse ou cozinhe a batata doce.", "Sirva com fio de azeite."]'::jsonb,
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    _gym_id,
    'Salmão com Quinoa e Legumes',
    'Jantar rico em ômega-3, fibras e proteína.',
    'jantar',
    35,
    520, 39, 34, 22,
    '["160g de salmão", "120g de quinoa cozida", "legumes variados", "limão", "sal"]'::jsonb,
    '["Asse o salmão com limão.", "Cozinhe a quinoa.", "Refogue os legumes e monte o prato."]'::jsonb,
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    _gym_id,
    'Omelete Fit de Espinafre',
    'Lanche rápido com alto teor proteico.',
    'lanche',
    12,
    260, 21, 6, 16,
    '["3 ovos", "espinafre", "queijo branco light", "sal e orégano"]'::jsonb,
    '["Bata os ovos.", "Refogue espinafre rapidamente.", "Prepare a omelete e finalize com queijo."]'::jsonb,
    'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    _gym_id,
    'Iogurte Grego com Frutas e Chia',
    'Ceia leve para recuperação noturna.',
    'ceia',
    5,
    210, 17, 20, 6,
    '["170g de iogurte grego", "1 porção de frutas", "1 colher de chia"]'::jsonb,
    '["Sirva o iogurte em um bowl.", "Adicione frutas picadas.", "Finalize com chia."]'::jsonb,
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

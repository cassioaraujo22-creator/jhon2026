-- Backfill: ensure 5 demo recipes exist for every gym
WITH demo_recipes AS (
  SELECT
    v.title,
    v.description,
    v.meal_type,
    v.prep_time_minutes,
    v.calories,
    v.protein_g,
    v.carbs_g,
    v.fat_g,
    v.ingredients::jsonb AS ingredients,
    v.steps::jsonb AS steps,
    v.image_url,
    true AS is_active
  FROM (
    VALUES
      (
        'Overnight Oats Proteico',
        'Aveia com iogurte e whey para um café da manhã prático.',
        'cafe_da_manha',
        10,
        320,
        24::numeric,
        38::numeric,
        8::numeric,
        '["40g de aveia", "170g de iogurte natural", "1 scoop de whey", "1 colher de chia", "frutas vermelhas"]',
        '["Misture aveia, iogurte e whey.", "Leve à geladeira por 6-8h.", "Finalize com chia e frutas."]',
        'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80'
      ),
      (
        'Frango Grelhado com Batata Doce',
        'Refeição clássica para ganho de massa e energia sustentada.',
        'almoco',
        30,
        480,
        42::numeric,
        45::numeric,
        12::numeric,
        '["180g de peito de frango", "200g de batata doce", "azeite", "sal e pimenta"]',
        '["Tempere e grelhe o frango.", "Asse ou cozinhe a batata doce.", "Sirva com fio de azeite."]',
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80'
      ),
      (
        'Salmão com Quinoa e Legumes',
        'Jantar rico em ômega-3, fibras e proteína.',
        'jantar',
        35,
        520,
        39::numeric,
        34::numeric,
        22::numeric,
        '["160g de salmão", "120g de quinoa cozida", "legumes variados", "limão", "sal"]',
        '["Asse o salmão com limão.", "Cozinhe a quinoa.", "Refogue os legumes e monte o prato."]',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
      ),
      (
        'Omelete Fit de Espinafre',
        'Lanche rápido com alto teor proteico.',
        'lanche',
        12,
        260,
        21::numeric,
        6::numeric,
        16::numeric,
        '["3 ovos", "espinafre", "queijo branco light", "sal e orégano"]',
        '["Bata os ovos.", "Refogue espinafre rapidamente.", "Prepare a omelete e finalize com queijo."]',
        'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80'
      ),
      (
        'Iogurte Grego com Frutas e Chia',
        'Ceia leve para recuperação noturna.',
        'ceia',
        5,
        210,
        17::numeric,
        20::numeric,
        6::numeric,
        '["170g de iogurte grego", "1 porção de frutas", "1 colher de chia"]',
        '["Sirva o iogurte em um bowl.", "Adicione frutas picadas.", "Finalize com chia."]',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'
      )
  ) AS v(
    title, description, meal_type, prep_time_minutes, calories, protein_g, carbs_g, fat_g, ingredients, steps, image_url
  )
)
INSERT INTO public.recipes (
  gym_id,
  title,
  description,
  meal_type,
  prep_time_minutes,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  ingredients,
  steps,
  image_url,
  is_active
)
SELECT
  g.id AS gym_id,
  d.title,
  d.description,
  d.meal_type,
  d.prep_time_minutes,
  d.calories,
  d.protein_g,
  d.carbs_g,
  d.fat_g,
  d.ingredients,
  d.steps,
  d.image_url,
  d.is_active
FROM public.gyms g
CROSS JOIN demo_recipes d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.recipes r
  WHERE r.gym_id = g.id
    AND lower(r.title) = lower(d.title)
);

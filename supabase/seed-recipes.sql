-- Seed de receitas + imagens (Nutricionista)
--
-- COMO USAR:
-- 1) No Supabase Dashboard -> SQL Editor, execute este script.
-- 2) Substitua o valor de seed.gym_id abaixo pelo ID real da sua academia (gyms.id).
--    Dica: pegue em `public.gyms` ou em `public.profiles.gym_id` do nutricionista.
--
-- Observação: A tela do app filtra receitas por `gym_id`, então isso é obrigatório.

begin;

-- 1) Defina o gym_id correto aqui
with seed as (
  select
    'SEU_GYM_ID_AQUI'::uuid as gym_id
),
recipes_seed as (
  select
    r.*
  from (
    values
      (
        '2426d431-37e0-4c39-ab53-d61c7d78ea62'::uuid,
        (select gym_id from seed),
        'Iogurte Grego com Frutas e Chia',
        'Proteico, rápido e ótimo para o café da manhã.',
        'cafe_da_manha',
        5,
        320, 22, 35, 10,
        array['170g iogurte grego natural','1 banana (ou frutas vermelhas)','1 c.s. chia','1 c.chá mel (opcional)']::text[],
        array['Misture o iogurte com a chia.','Adicione as frutas por cima.','Finalize com mel se desejar.']::text[],
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
        true
      ),
      (
        'd5e8ebec-d64b-45ff-8c0d-1ed4a5d85924'::uuid,
        (select gym_id from seed),
        'Frango Grelhado com Batata Doce',
        'Refeição completa para ganho de massa ou recomposição.',
        'almoco',
        25,
        520, 45, 50, 12,
        array['180g peito de frango','200g batata doce','Sal e pimenta','Azeite (1 c.chá)','Páprica/ervas (opcional)']::text[],
        array['Tempere o frango.','Grelhe até dourar.','Asse ou cozinhe a batata doce.','Sirva com 1 fio de azeite.']::text[],
        'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=400&fit=crop',
        true
      ),
      (
        'a2cca91e-e5e0-4bb4-ba2b-7dced46d6fa3'::uuid,
        (select gym_id from seed),
        'Overnight Oats Proteico',
        'Prático para preparar na noite anterior.',
        'cafe_da_manha',
        10,
        410, 30, 45, 12,
        array['50g aveia','200ml leite ou bebida vegetal','1 scoop whey (opcional)','1 c.s. pasta de amendoim','Canela']::text[],
        array['Misture tudo em um pote.','Leve à geladeira por 6–8h.','Consuma gelado.']::text[],
        'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=400&fit=crop',
        true
      ),
      (
        '5f080983-18bf-428f-9912-484f5a973bd2'::uuid,
        (select gym_id from seed),
        'Salmão com Quinoa e Legumes',
        'Rica em ômega-3 e com bons carboidratos.',
        'jantar',
        30,
        610, 40, 45, 28,
        array['150g salmão','80g quinoa cozida','Mix de legumes','Sal','Limão','Azeite (1 c.chá)']::text[],
        array['Tempere o salmão com sal e limão.','Grelhe/asse o salmão.','Cozinhe a quinoa.','Salteie os legumes e monte o prato.']::text[],
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
        true
      ),
      (
        'f4403298-3dea-410f-87c2-a651f6166d13'::uuid,
        (select gym_id from seed),
        'Omelete Fit de Espinafre',
        'Opção leve para lanche ou jantar.',
        'lanche',
        12,
        290, 22, 6, 18,
        array['2 ovos','1 xíc. espinafre','Sal','Pimenta','Queijo light (opcional)']::text[],
        array['Bata os ovos e tempere.','Adicione o espinafre.','Cozinhe em frigideira antiaderente.']::text[],
        'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=400&fit=crop',
        true
      )
  ) as r(
    id,
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
)
insert into public.recipes (
  id,
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
select
  id,
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
from recipes_seed
on conflict (id) do update set
  gym_id = excluded.gym_id,
  title = excluded.title,
  description = excluded.description,
  meal_type = excluded.meal_type,
  prep_time_minutes = excluded.prep_time_minutes,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  image_url = excluded.image_url,
  is_active = excluded.is_active;

commit;


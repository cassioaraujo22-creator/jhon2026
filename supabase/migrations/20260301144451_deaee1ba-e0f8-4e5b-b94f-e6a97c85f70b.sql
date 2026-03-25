
-- ========================================
-- STORE MODULE: Tables, RLS, Triggers, Seed
-- ========================================

-- A) store_categories
CREATE TABLE public.store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  banner_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gym_id, slug)
);

-- B) store_products
CREATE TABLE public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.store_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  short_description text,
  description text,
  benefits jsonb DEFAULT '[]'::jsonb,
  ingredients_or_materials jsonb DEFAULT '[]'::jsonb,
  usage_instructions text,
  images jsonb DEFAULT '[]'::jsonb,
  price_cents integer NOT NULL DEFAULT 0,
  compare_at_price_cents integer,
  stock_quantity integer NOT NULL DEFAULT 0,
  sku text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gym_id, slug)
);

-- C) store_cart_items
CREATE TABLE public.store_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, product_id)
);

-- D) store_orders
CREATE TABLE public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_cents integer NOT NULL DEFAULT 0,
  payment_provider text,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- E) store_order_items
CREATE TABLE public.store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  price_cents_snapshot integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1
);

-- Triggers for updated_at
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_store_cart_items_updated_at
  BEFORE UPDATE ON public.store_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- RLS
-- ========================================

ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- store_categories: gym members can see active, staff manages all
CREATE POLICY "Gym members see active categories"
  ON public.store_categories FOR SELECT TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) AND is_active = true);

CREATE POLICY "Staff manages categories"
  ON public.store_categories FOR ALL TO authenticated
  USING (is_gym_staff(auth.uid(), gym_id));

-- store_products: gym members see active, staff manages all
CREATE POLICY "Gym members see active products"
  ON public.store_products FOR SELECT TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) AND is_active = true);

CREATE POLICY "Staff manages products"
  ON public.store_products FOR ALL TO authenticated
  USING (is_gym_staff(auth.uid(), gym_id));

-- store_cart_items: member owns their cart
CREATE POLICY "Members see own cart"
  ON public.store_cart_items FOR SELECT TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members insert own cart"
  ON public.store_cart_items FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members update own cart"
  ON public.store_cart_items FOR UPDATE TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members delete own cart"
  ON public.store_cart_items FOR DELETE TO authenticated
  USING (member_id = auth.uid());

-- store_orders: member sees own, staff sees all
CREATE POLICY "Members see own orders"
  ON public.store_orders FOR SELECT TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members insert own orders"
  ON public.store_orders FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Staff manages orders"
  ON public.store_orders FOR ALL TO authenticated
  USING (is_gym_staff(auth.uid(), gym_id));

-- store_order_items: via order access
CREATE POLICY "Members see own order items"
  ON public.store_order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.store_orders o
    WHERE o.id = store_order_items.order_id AND o.member_id = auth.uid()
  ));

CREATE POLICY "Members insert own order items"
  ON public.store_order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.store_orders o
    WHERE o.id = store_order_items.order_id AND o.member_id = auth.uid()
  ));

CREATE POLICY "Staff manages order items"
  ON public.store_order_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.store_orders o
    WHERE o.id = store_order_items.order_id AND is_gym_staff(auth.uid(), o.gym_id)
  ));

-- ========================================
-- SEED DATA (uses first gym)
-- ========================================

DO $$
DECLARE
  _gym_id uuid;
  _cat_suplementos uuid;
  _cat_roupas uuid;
  _cat_acessorios uuid;
  _cat_luvas uuid;
BEGIN
  SELECT id INTO _gym_id FROM public.gyms LIMIT 1;
  IF _gym_id IS NULL THEN RETURN; END IF;

  -- Categories
  INSERT INTO public.store_categories (id, gym_id, name, slug, description, icon, sort_order)
  VALUES
    (gen_random_uuid(), _gym_id, 'Suplementos', 'suplementos', 'Whey, creatina, pré-treino e mais', 'pill', 1)
  RETURNING id INTO _cat_suplementos;

  INSERT INTO public.store_categories (id, gym_id, name, slug, description, icon, sort_order)
  VALUES
    (gen_random_uuid(), _gym_id, 'Roupas', 'roupas', 'Camisetas, shorts, leggings e mais', 'shirt', 2)
  RETURNING id INTO _cat_roupas;

  INSERT INTO public.store_categories (id, gym_id, name, slug, description, icon, sort_order)
  VALUES
    (gen_random_uuid(), _gym_id, 'Acessórios', 'acessorios', 'Garrafas, cintas, faixas e mais', 'dumbbell', 3)
  RETURNING id INTO _cat_acessorios;

  INSERT INTO public.store_categories (id, gym_id, name, slug, description, icon, sort_order)
  VALUES
    (gen_random_uuid(), _gym_id, 'Luvas', 'luvas', 'Luvas para musculação e cross', 'hand-metal', 4)
  RETURNING id INTO _cat_luvas;

  -- Suplementos (4 products)
  INSERT INTO public.store_products (gym_id, category_id, name, slug, short_description, description, price_cents, compare_at_price_cents, stock_quantity, is_featured, tags, images) VALUES
    (_gym_id, _cat_suplementos, 'Whey Performance 900g', 'whey-performance-900g', 'Proteína isolada de alta absorção', 'Whey Protein Isolado com 27g de proteína por dose. Ideal para recuperação muscular pós-treino. Sabor chocolate.', 14990, 17990, 50, true, ARRAY['proteina','whey','isolado'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Whey+900g"]'::jsonb),
    (_gym_id, _cat_suplementos, 'Creatina Monohidratada 300g', 'creatina-mono-300g', 'Creatina pura para força e volume', 'Creatina monohidratada micronizada. Aumenta força, potência e volume muscular. 100 doses.', 8990, NULL, 80, false, ARRAY['creatina','forca'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Creatina+300g"]'::jsonb),
    (_gym_id, _cat_suplementos, 'Pré-treino Nitro Pump', 'pre-treino-nitro-pump', 'Energia explosiva para seu treino', 'Pré-treino com cafeína, beta-alanina e citrulina. Foco e energia por até 3 horas. Sabor frutas vermelhas.', 6990, 7990, 35, true, ARRAY['pre-treino','energia','foco'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Pre-treino"]'::jsonb),
    (_gym_id, _cat_suplementos, 'Multivitamínico Ativo', 'multivitaminico-ativo', 'Vitaminas e minerais essenciais', 'Complexo com 25 vitaminas e minerais. Suporte para imunidade e performance. 60 cápsulas.', 4990, NULL, 100, false, ARRAY['vitaminas','saude'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Multivitaminico"]'::jsonb);

  -- Roupas (4 products)
  INSERT INTO public.store_products (gym_id, category_id, name, slug, short_description, description, price_cents, compare_at_price_cents, stock_quantity, is_featured, tags, images) VALUES
    (_gym_id, _cat_roupas, 'Camiseta DryFit Elite', 'camiseta-dryfit-elite', 'Tecnologia de secagem rápida', 'Camiseta masculina com tecido DryFit premium. Leve, respirável e com proteção UV. Disponível em P, M, G, GG.', 7990, 9990, 40, true, ARRAY['camiseta','dryfit','uv'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Camiseta+DryFit"]'::jsonb),
    (_gym_id, _cat_roupas, 'Regata Performance Pro', 'regata-performance-pro', 'Máxima ventilação para treinos intensos', 'Regata cavada com tecido ultra leve e costuras flatlock. Perfeita para musculação e cross.', 5990, NULL, 60, false, ARRAY['regata','leve'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Regata+Pro"]'::jsonb),
    (_gym_id, _cat_roupas, 'Shorts Compressão Flex', 'shorts-compressao-flex', 'Suporte muscular com conforto', 'Shorts de compressão com bolso lateral. Tecido com elastano para máxima mobilidade.', 8990, 10990, 30, false, ARRAY['shorts','compressao'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Shorts+Flex"]'::jsonb),
    (_gym_id, _cat_roupas, 'Moletom Premium Gym', 'moletom-premium-gym', 'Estilo e conforto pós-treino', 'Moletom unissex com capuz e bolso canguru. Tecido flanelado premium. Logo bordado.', 14990, NULL, 25, true, ARRAY['moletom','inverno','premium'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Moletom+Premium"]'::jsonb);

  -- Acessórios (4 products)
  INSERT INTO public.store_products (gym_id, category_id, name, slug, short_description, description, price_cents, compare_at_price_cents, stock_quantity, is_featured, tags, images) VALUES
    (_gym_id, _cat_acessorios, 'Garrafa Térmica 1L', 'garrafa-termica-1l', 'Mantém temperatura por 12h', 'Garrafa térmica em aço inox com capacidade de 1 litro. Tampa rosqueável com bico. Preta fosca.', 6990, 8490, 45, true, ARRAY['garrafa','termica'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Garrafa+1L"]'::jsonb),
    (_gym_id, _cat_acessorios, 'Cinta Lombar Pro', 'cinta-lombar-pro', 'Suporte para levantamentos pesados', 'Cinta lombar em neoprene com velcro reforçado. Proteção para agachamento e terra.', 7990, NULL, 20, false, ARRAY['cinta','lombar','protecao'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Cinta+Lombar"]'::jsonb),
    (_gym_id, _cat_acessorios, 'Faixa Elástica Kit (3 níveis)', 'faixa-elastica-kit-3', 'Leve, média e pesada', 'Kit com 3 faixas elásticas de resistência progressiva. Ideal para aquecimento e reabilitação.', 4990, NULL, 70, false, ARRAY['faixa','elastica','kit'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Faixa+Kit"]'::jsonb),
    (_gym_id, _cat_acessorios, 'Strap Puxada Heavy', 'strap-puxada-heavy', 'Aderência máxima na barra', 'Straps de puxada em algodão reforçado com forro de neoprene. Par.', 3990, NULL, 55, false, ARRAY['strap','puxada'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Strap+Heavy"]'::jsonb);

  -- Luvas (4 products)
  INSERT INTO public.store_products (gym_id, category_id, name, slug, short_description, description, price_cents, compare_at_price_cents, stock_quantity, is_featured, tags, images) VALUES
    (_gym_id, _cat_luvas, 'Luva Treino Grip', 'luva-treino-grip', 'Aderência e proteção básica', 'Luva de musculação com palma emborrachada e dorso em mesh respirável. Fechamento em velcro.', 4990, NULL, 60, false, ARRAY['luva','basica'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Luva+Grip"]'::jsonb),
    (_gym_id, _cat_luvas, 'Luva Pro Gel', 'luva-pro-gel', 'Amortecimento gel para treinos pesados', 'Luva com palmilha em gel absorvente de impacto. Couro sintético premium. Dedos abertos.', 7990, 9990, 35, true, ARRAY['luva','gel','premium'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Luva+Pro+Gel"]'::jsonb),
    (_gym_id, _cat_luvas, 'Luva Wrist Support', 'luva-wrist-support', 'Luva com proteção de punho integrada', 'Luva com munhequeira integrada em neoprene. Suporte extra para supino e desenvolvimento.', 8990, NULL, 25, false, ARRAY['luva','punho','suporte'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Luva+Wrist"]'::jsonb),
    (_gym_id, _cat_luvas, 'Luva Cross Training', 'luva-cross-training', 'Para WODs e treinos funcionais', 'Luva minimalista de cross training. Proteção para pull-ups, kettlebells e barras. Ultra resistente.', 6990, 7990, 40, false, ARRAY['luva','cross','funcional'], '["https://placehold.co/600x600/1a1a2e/7c3aed?text=Luva+Cross"]'::jsonb);

END $$;

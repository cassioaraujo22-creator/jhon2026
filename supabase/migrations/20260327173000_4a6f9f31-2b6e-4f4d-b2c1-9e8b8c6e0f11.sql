-- Multi-cycle plan support
-- Adds plan_cycles table and links purchase/subscription entities to selected cycle.

CREATE TABLE IF NOT EXISTS public.plan_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  cycle_name TEXT NOT NULL,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  price_cents INT NOT NULL CHECK (price_cents > 0),
  sort_order INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  external_product_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_cycles_plan_id ON public.plan_cycles(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_cycles_gym_id ON public.plan_cycles(gym_id);
CREATE INDEX IF NOT EXISTS idx_plan_cycles_active ON public.plan_cycles(active);
CREATE INDEX IF NOT EXISTS idx_plan_cycles_external_product_code ON public.plan_cycles(external_product_code);

ALTER TABLE public.plan_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym members see plan cycles" ON public.plan_cycles;
CREATE POLICY "Gym members see plan cycles"
ON public.plan_cycles
FOR SELECT
USING (gym_id = public.get_user_gym_id(auth.uid()));

DROP POLICY IF EXISTS "Staff manages plan cycles" ON public.plan_cycles;
CREATE POLICY "Staff manages plan cycles"
ON public.plan_cycles
FOR ALL
USING (public.is_gym_staff(auth.uid(), gym_id))
WITH CHECK (public.is_gym_staff(auth.uid(), gym_id));

DROP TRIGGER IF EXISTS update_plan_cycles_updated_at ON public.plan_cycles;
CREATE TRIGGER update_plan_cycles_updated_at
BEFORE UPDATE ON public.plan_cycles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Backfill one default cycle for legacy plans.
INSERT INTO public.plan_cycles (plan_id, gym_id, cycle_name, duration_days, price_cents, sort_order, active)
SELECT
  p.id,
  p.gym_id,
  CASE p.billing_cycle
    WHEN 'monthly' THEN 'Mensal'
    WHEN 'semiannual' THEN 'Semestral'
    WHEN 'annual' THEN 'Anual'
    ELSE 'Programa'
  END AS cycle_name,
  GREATEST(
    COALESCE(p.duration_weeks, 0) * 7,
    CASE p.billing_cycle
      WHEN 'monthly' THEN 30
      WHEN 'semiannual' THEN 180
      WHEN 'annual' THEN 365
      ELSE 30
    END
  ) AS duration_days,
  GREATEST(COALESCE(p.price_cents, 0), 1) AS price_cents,
  1,
  COALESCE(p.active, true)
FROM public.plans p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.plan_cycles pc
  WHERE pc.plan_id = p.id
);

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS plan_cycle_id UUID REFERENCES public.plan_cycles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_cycle_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_cycle_days INT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_cycle_id UUID REFERENCES public.plan_cycles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_cycle_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_cycle_days INT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_cycle_id UUID REFERENCES public.plan_cycles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_cycle_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_cycle_days INT;

CREATE INDEX IF NOT EXISTS idx_memberships_plan_cycle_id ON public.memberships(plan_cycle_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_cycle_id ON public.subscriptions(plan_cycle_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_cycle_id ON public.payments(plan_cycle_id);

WITH first_cycle AS (
  SELECT DISTINCT ON (pc.plan_id)
    pc.plan_id,
    pc.id,
    pc.cycle_name,
    pc.duration_days
  FROM public.plan_cycles pc
  WHERE pc.active = true
  ORDER BY pc.plan_id, pc.sort_order ASC, pc.created_at ASC
)
UPDATE public.memberships m
SET
  plan_cycle_id = fc.id,
  plan_cycle_name = fc.cycle_name,
  plan_cycle_days = fc.duration_days
FROM first_cycle fc
WHERE m.plan_id = fc.plan_id
  AND m.plan_cycle_id IS NULL;

WITH first_cycle AS (
  SELECT DISTINCT ON (pc.plan_id)
    pc.plan_id,
    pc.id,
    pc.cycle_name,
    pc.duration_days
  FROM public.plan_cycles pc
  WHERE pc.active = true
  ORDER BY pc.plan_id, pc.sort_order ASC, pc.created_at ASC
)
UPDATE public.subscriptions s
SET
  plan_cycle_id = fc.id,
  plan_cycle_name = fc.cycle_name,
  plan_cycle_days = fc.duration_days
FROM first_cycle fc
WHERE s.plan_id = fc.plan_id
  AND s.plan_cycle_id IS NULL;

WITH first_cycle AS (
  SELECT DISTINCT ON (pc.plan_id)
    pc.plan_id,
    pc.id,
    pc.cycle_name,
    pc.duration_days
  FROM public.plan_cycles pc
  WHERE pc.active = true
  ORDER BY pc.plan_id, pc.sort_order ASC, pc.created_at ASC
)
UPDATE public.payments p
SET
  plan_cycle_id = fc.id,
  plan_cycle_name = fc.cycle_name,
  plan_cycle_days = fc.duration_days
FROM first_cycle fc
WHERE p.plan_id = fc.plan_id
  AND p.plan_cycle_id IS NULL;


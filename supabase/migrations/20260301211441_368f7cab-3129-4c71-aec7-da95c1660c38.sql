
-- Add promotion flag and label to store_products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS is_promotion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_label text DEFAULT NULL;

-- Index for fast promotion queries
CREATE INDEX IF NOT EXISTS idx_store_products_promotion ON public.store_products (is_promotion, is_active) WHERE is_promotion = true AND is_active = true;

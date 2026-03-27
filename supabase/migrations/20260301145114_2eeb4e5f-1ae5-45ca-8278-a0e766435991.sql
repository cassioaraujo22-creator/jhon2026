
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-products', 'store-products', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view product images
CREATE POLICY "Public read store product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-products');

-- Staff can upload/update/delete
CREATE POLICY "Staff uploads store product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-products'
    AND is_gym_staff(auth.uid(), get_user_gym_id(auth.uid()))
  );

CREATE POLICY "Staff updates store product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-products'
    AND is_gym_staff(auth.uid(), get_user_gym_id(auth.uid()))
  );

CREATE POLICY "Staff deletes store product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-products'
    AND is_gym_staff(auth.uid(), get_user_gym_id(auth.uid()))
  );

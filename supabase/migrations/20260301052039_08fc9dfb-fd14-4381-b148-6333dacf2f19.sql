-- Create storage bucket for exercise media (AI-generated illustrations)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view exercise media (public bucket)
CREATE POLICY "Exercise media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-media');

-- Staff can upload exercise media
CREATE POLICY "Staff can upload exercise media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-media'
  AND auth.role() = 'authenticated'
);

-- Staff can update exercise media
CREATE POLICY "Staff can update exercise media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-media'
  AND auth.role() = 'authenticated'
);

-- Staff can delete exercise media
CREATE POLICY "Staff can delete exercise media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-media'
  AND auth.role() = 'authenticated'
);
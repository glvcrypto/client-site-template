-- Create storage bucket for inventory images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
CREATE POLICY "Authenticated can upload inventory images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inventory-images');

-- Authenticated users can delete
CREATE POLICY "Authenticated can delete inventory images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inventory-images');

-- Public read access
CREATE POLICY "Public can read inventory images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'inventory-images');

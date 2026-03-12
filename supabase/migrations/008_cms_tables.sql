-- 008: CMS tables — content management, banners, navigation, staff, testimonials
-- Provides editable site content without code changes

-- =============================================================================
-- 1. site_content — key-value content store per page
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  content_key text NOT NULL,
  content_value text,
  content_type text NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text', 'html', 'image_url', 'json')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (page_slug, content_key)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content" ON public.site_content
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert content" ON public.site_content
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update content" ON public.site_content
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete content" ON public.site_content
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 2. site_banners — rotating banners
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  location_id uuid REFERENCES public.site_locations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read banners" ON public.site_banners
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert banners" ON public.site_banners
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update banners" ON public.site_banners
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete banners" ON public.site_banners
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE TRIGGER set_site_banners_updated_at
  BEFORE UPDATE ON public.site_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 3. site_navigation — menu items (labels + visibility only)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  route_path text NOT NULL,
  parent_id uuid REFERENCES public.site_navigation(id),
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  icon text,
  module_key text
);

ALTER TABLE public.site_navigation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read navigation" ON public.site_navigation
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert navigation" ON public.site_navigation
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update navigation" ON public.site_navigation
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete navigation" ON public.site_navigation
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 4. site_staff — staff directory
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role_title text,
  department text,
  photo_url text,
  bio text,
  email text,
  phone text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read staff" ON public.site_staff
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert staff" ON public.site_staff
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update staff" ON public.site_staff
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete staff" ON public.site_staff
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE TRIGGER set_site_staff_updated_at
  BEFORE UPDATE ON public.site_staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 5. site_testimonials — customer testimonials
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  quote text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials" ON public.site_testimonials
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert testimonials" ON public.site_testimonials
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update testimonials" ON public.site_testimonials
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete testimonials" ON public.site_testimonials
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 6. Seed default navigation
-- =============================================================================
INSERT INTO public.site_navigation (label, route_path, display_order, is_visible, module_key) VALUES
  ('Home',      '/',           0, true, NULL),
  ('Inventory', '/inventory',  1, true, NULL),
  ('Services',  '/services',   2, true, NULL),
  ('Financing', '/financing',  3, true, NULL),
  ('About',     '/about',      4, true, NULL),
  ('Contact',   '/contact',    5, true, NULL),
  ('Shop',      '/shop',       6, true, 'ecommerce')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. Seed default page content
-- =============================================================================
INSERT INTO public.site_content (page_slug, content_key, content_value, content_type) VALUES
  -- Home page
  ('home', 'hero_headline',  'Welcome to Our Dealership',       'text'),
  ('home', 'hero_subtitle',  'Quality vehicles, honest service', 'text'),
  ('home', 'hero_cta_text',  'View Inventory',                  'text'),
  ('home', 'hero_cta_link',  '/inventory',                      'text'),
  ('home', 'hero_image',     NULL,                               'image_url'),
  -- About page
  ('about', 'title', 'About Us',              'text'),
  ('about', 'body',  '',                       'html'),
  ('about', 'image', NULL,                     'image_url'),
  -- Services page
  ('services', 'title', 'Our Services',        'text'),
  ('services', 'intro', '',                     'text'),
  -- Financing page
  ('financing', 'title', 'Financing Options',  'text'),
  ('financing', 'body',  '',                    'html'),
  -- Contact page
  ('contact', 'title', 'Contact Us',           'text'),
  ('contact', 'intro', '',                      'text')
ON CONFLICT (page_slug, content_key) DO NOTHING;

-- =============================================================================
-- 8. Storage bucket — cms-images
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-images',
  'cms-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read cms-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-images');

-- Authenticated write access
CREATE POLICY "Authenticated upload cms-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cms-images');

CREATE POLICY "Authenticated update cms-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cms-images')
  WITH CHECK (bucket_id = 'cms-images');

CREATE POLICY "Authenticated delete cms-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cms-images');

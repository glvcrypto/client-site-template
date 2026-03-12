-- 007: Module system, locations, hours, social links, integrations
-- Foundation for v2 platform feature toggling and multi-location support

-- =============================================================================
-- 1. Ensure updated_at trigger function exists
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. site_modules — controls which features are visible
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  enabled_by uuid REFERENCES auth.users(id),
  enabled_at timestamptz
);

ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modules" ON public.site_modules
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert modules" ON public.site_modules
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can update modules" ON public.site_modules
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can delete modules" ON public.site_modules
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Seed default modules
INSERT INTO public.site_modules (module_key, is_enabled) VALUES
  ('ecommerce', false),
  ('service_booking', true),
  ('reviews', false),
  ('financing', true),
  ('blog', false),
  ('ads', false)
ON CONFLICT (module_key) DO NOTHING;

-- =============================================================================
-- 3. site_locations — multi-location support (defaults to single)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  province text NOT NULL DEFAULT 'Ontario',
  postal_code text,
  phone text,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  lat double precision,
  lng double precision,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read locations" ON public.site_locations
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert locations" ON public.site_locations
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update locations" ON public.site_locations
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete locations" ON public.site_locations
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE TRIGGER set_site_locations_updated_at
  BEFORE UPDATE ON public.site_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. site_hours — business hours per location
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.site_locations(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE (location_id, day_of_week)
);

ALTER TABLE public.site_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hours" ON public.site_hours
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert hours" ON public.site_hours
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update hours" ON public.site_hours
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete hours" ON public.site_hours
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 5. site_social_links — social media profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.site_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read social links" ON public.site_social_links
  FOR SELECT USING (true);

CREATE POLICY "Owner+ can insert social links" ON public.site_social_links
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update social links" ON public.site_social_links
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete social links" ON public.site_social_links
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 6. site_integrations — third-party integration configs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.site_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type text NOT NULL UNIQUE,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_connected boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read integrations" ON public.site_integrations
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can insert integrations" ON public.site_integrations
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can update integrations" ON public.site_integrations
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can delete integrations" ON public.site_integrations
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE TRIGGER set_site_integrations_updated_at
  BEFORE UPDATE ON public.site_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 7. ALTER existing tables — add location_id FK
-- =============================================================================
ALTER TABLE public.dealer_inventory
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.site_locations(id);

ALTER TABLE public.portal_leads
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.site_locations(id);

ALTER TABLE public.dealer_services
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.site_locations(id);

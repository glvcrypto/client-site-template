-- 009: Service booking — catalogue, availability, and customer bookings
-- Upgrades the service system from simple request tracking to bookable services

-- =============================================================================
-- 1. service_catalogue — menu of bookable services
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.service_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_price decimal(10,2),
  estimated_duration_minutes integer DEFAULT 60,
  category text,
  allow_booking boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalogue ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read service catalogue" ON public.service_catalogue
  FOR SELECT USING (true);

-- Owner+ write
CREATE POLICY "Owner+ can insert service catalogue" ON public.service_catalogue
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update service catalogue" ON public.service_catalogue
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete service catalogue" ON public.service_catalogue
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE TRIGGER set_service_catalogue_updated_at
  BEFORE UPDATE ON public.service_catalogue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 2. service_availability — weekly schedule per location
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.service_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.site_locations(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  max_bookings_per_slot integer NOT NULL DEFAULT 2,
  slot_duration_minutes integer NOT NULL DEFAULT 60,
  is_available boolean NOT NULL DEFAULT true,
  UNIQUE (location_id, day_of_week)
);

ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read service availability" ON public.service_availability
  FOR SELECT USING (true);

-- Owner+ write
CREATE POLICY "Owner+ can insert service availability" ON public.service_availability
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update service availability" ON public.service_availability
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete service availability" ON public.service_availability
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 3. service_bookings — customer booking requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text,
  service_id uuid REFERENCES public.service_catalogue(id),
  preferred_date date NOT NULL,
  preferred_time_slot time NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  confirmed_date date,
  confirmed_time time,
  location_id uuid REFERENCES public.site_locations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can book)
CREATE POLICY "Anyone can insert bookings" ON public.service_bookings
  FOR INSERT WITH CHECK (true);

-- Authenticated read
CREATE POLICY "Authenticated can read bookings" ON public.service_bookings
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated update (admin status changes)
CREATE POLICY "Authenticated can update bookings" ON public.service_bookings
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER set_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. Seed sample services
-- =============================================================================
INSERT INTO public.service_catalogue (name, default_price, estimated_duration_minutes, category, display_order) VALUES
  ('Oil Change',             89.99, 60,  'Marine',         0),
  ('Winterization',         249.99, 120, 'Marine',         1),
  ('Tune-Up',               69.99, 45,  'Lawn & Garden',  2),
  ('Pre-Season Inspection', 149.99, 90,  'General',        3)
ON CONFLICT DO NOTHING;

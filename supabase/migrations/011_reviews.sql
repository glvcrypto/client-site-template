-- 011: Reviews & reputation — reviews, review requests, and configuration
-- Phase 5 of the dealership CRM template

-- =============================================================================
-- 1. reviews — aggregated reviews from all sources
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('google', 'facebook', 'manual')),
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  review_date timestamptz NOT NULL DEFAULT now(),
  response_text text,
  responded_at timestamptz,
  external_id text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index for deduplication of external reviews
CREATE UNIQUE INDEX idx_reviews_source_external_id
  ON public.reviews (source, external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read (visible reviews shown on site)
CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

-- Owner+ write
CREATE POLICY "Owner+ can insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

CREATE POLICY "Owner+ can delete reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'owner'));

-- =============================================================================
-- 2. review_requests — outbound review solicitation tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text,
  trigger_type text NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('service_complete', 'unit_sold', 'manual')),
  trigger_id uuid,
  sent_at timestamptz,
  clicked_at timestamptz,
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'completed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated full access
CREATE POLICY "Authenticated can read review requests" ON public.review_requests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert review requests" ON public.review_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update review requests" ON public.review_requests
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete review requests" ON public.review_requests
  FOR DELETE TO authenticated
  USING (true);

-- =============================================================================
-- 3. review_config — site-level review settings (single row)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id text,
  auto_request_enabled boolean NOT NULL DEFAULT false,
  request_delay_hours integer NOT NULL DEFAULT 24,
  request_email_template text NOT NULL DEFAULT E'Hi {{customer_name}},\n\nThank you for choosing us! We would love to hear about your experience.\n\nPlease leave us a review: {{review_url}}\n\nThank you!',
  min_rating_to_display integer NOT NULL DEFAULT 4
    CHECK (min_rating_to_display >= 1 AND min_rating_to_display <= 5),
  review_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_config ENABLE ROW LEVEL SECURITY;

-- Authenticated read
CREATE POLICY "Authenticated can read review config" ON public.review_config
  FOR SELECT TO authenticated
  USING (true);

-- Admin write
CREATE POLICY "Admin can insert review config" ON public.review_config
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Admin can update review config" ON public.review_config
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

-- =============================================================================
-- 4. Seed default config row
-- =============================================================================
INSERT INTO public.review_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

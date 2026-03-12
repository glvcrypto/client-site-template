-- ============================================================================
-- 013 — Enhanced Analytics: traffic, devices, pages, ad performance, ad config
-- ============================================================================

-- ── analytics_traffic_sources ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_traffic_sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date     DATE NOT NULL,
  source            TEXT NOT NULL,
  medium            TEXT NOT NULL,
  sessions          INTEGER DEFAULT 0,
  users             INTEGER DEFAULT 0,
  bounce_rate       DECIMAL(5,2),
  pages_per_session DECIMAL(5,2),
  UNIQUE(snapshot_date, source, medium)
);

ALTER TABLE analytics_traffic_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_traffic_sources_select" ON analytics_traffic_sources
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IS NOT NULL
  );

CREATE POLICY "analytics_traffic_sources_insert" ON analytics_traffic_sources
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_traffic_sources_date ON analytics_traffic_sources (snapshot_date DESC);

-- ── analytics_device_breakdown ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_device_breakdown (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  device_type   TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  sessions      INTEGER DEFAULT 0,
  percentage    DECIMAL(5,2),
  UNIQUE(snapshot_date, device_type)
);

ALTER TABLE analytics_device_breakdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_device_breakdown_select" ON analytics_device_breakdown
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IS NOT NULL
  );

CREATE POLICY "analytics_device_breakdown_insert" ON analytics_device_breakdown
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_device_breakdown_date ON analytics_device_breakdown (snapshot_date DESC);

-- ── analytics_top_pages ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_top_pages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date     DATE NOT NULL,
  page_path         TEXT NOT NULL,
  page_title        TEXT,
  pageviews         INTEGER DEFAULT 0,
  avg_time_on_page  DECIMAL(8,2),
  bounce_rate       DECIMAL(5,2),
  UNIQUE(snapshot_date, page_path)
);

ALTER TABLE analytics_top_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_top_pages_select" ON analytics_top_pages
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IS NOT NULL
  );

CREATE POLICY "analytics_top_pages_insert" ON analytics_top_pages
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_top_pages_date ON analytics_top_pages (snapshot_date DESC);

-- ── analytics_ad_performance ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_ad_performance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date    DATE NOT NULL,
  platform         TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta', 'tiktok')),
  campaign_name    TEXT,
  campaign_id      TEXT,
  ad_set_name      TEXT,
  ad_name          TEXT,
  spend            DECIMAL(10,2) DEFAULT 0,
  impressions      INTEGER DEFAULT 0,
  clicks           INTEGER DEFAULT 0,
  ctr              DECIMAL(8,4),
  cpc              DECIMAL(10,2),
  conversions      INTEGER DEFAULT 0,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  roas             DECIMAL(10,2),
  status           TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  UNIQUE(snapshot_date, platform, campaign_id)
);

ALTER TABLE analytics_ad_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_ad_performance_select" ON analytics_ad_performance
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IS NOT NULL
  );

CREATE POLICY "analytics_ad_performance_insert" ON analytics_ad_performance
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_ad_performance_date ON analytics_ad_performance (snapshot_date DESC);

-- ── ad_config ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL UNIQUE CHECK (platform IN ('google_ads', 'meta', 'tiktok')),
  account_id      TEXT,
  is_enabled      BOOLEAN DEFAULT false,
  config_json     JSONB DEFAULT '{}'::jsonb,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ad_config ENABLE ROW LEVEL SECURITY;

-- admin/owner only
CREATE POLICY "ad_config_select" ON ad_config
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

CREATE POLICY "ad_config_update" ON ad_config
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

CREATE POLICY "ad_config_insert" ON ad_config
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

-- ── Seed ad_config rows ───────────────────────────────────────────────────────

INSERT INTO ad_config (platform) VALUES
  ('google_ads'),
  ('meta'),
  ('tiktok')
ON CONFLICT (platform) DO NOTHING;

-- ============================================================================
-- 010 · Ecommerce: products, orders, payments, shipping, tax, promo codes
-- ============================================================================

-- ── 1. Store Categories ─────────────────────────────────────────────────────

CREATE TABLE store_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   UUID REFERENCES store_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Store Products ───────────────────────────────────────────────────────

CREATE TABLE store_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  sku                 TEXT UNIQUE,
  price               DECIMAL(10,2),
  sale_price          DECIMAL(10,2),
  description         TEXT,
  images              JSONB DEFAULT '[]',
  category_id         UUID REFERENCES store_categories(id) ON DELETE SET NULL,
  brand               TEXT,
  quantity_available  INTEGER DEFAULT 0,
  weight              DECIMAL(8,2),
  dimensions          JSONB,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Store Orders ─────────────────────────────────────────────────────────

CREATE TABLE store_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      SERIAL,
  customer_name     TEXT,
  email             TEXT,
  phone             TEXT,
  shipping_address  JSONB,
  billing_address   JSONB,
  subtotal          DECIMAL(10,2),
  tax               DECIMAL(10,2) DEFAULT 0,
  shipping_cost     DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2),
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','processing','shipped','picked_up','cancelled','refunded')),
  payment_method    TEXT
                    CHECK (payment_method IN ('stripe','paypal','in_store')),
  payment_id        TEXT,
  tracking_number   TEXT,
  notes             TEXT,
  promo_code        TEXT,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  location_id       UUID REFERENCES site_locations(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Store Order Items ────────────────────────────────────────────────────

CREATE TABLE store_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES store_products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity     INTEGER,
  unit_price   DECIMAL(10,2),
  total        DECIMAL(10,2)
);

-- ── 5. Store Payment Config ─────────────────────────────────────────────────

CREATE TABLE store_payment_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL UNIQUE
              CHECK (provider IN ('stripe','paypal','in_store')),
  is_enabled  BOOLEAN DEFAULT false,
  config_json JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Store Shipping Methods ───────────────────────────────────────────────

CREATE TABLE store_shipping_methods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT CHECK (type IN ('flat_rate','weight_based','free','pickup')),
  rate              DECIMAL(10,2) DEFAULT 0,
  min_order_for_free DECIMAL(10,2),
  is_enabled        BOOLEAN DEFAULT false,
  display_order     INTEGER DEFAULT 0
);

-- ── 7. Store Tax Config ─────────────────────────────────────────────────────

CREATE TABLE store_tax_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region            TEXT,
  province_code     TEXT UNIQUE,
  rate_percent      DECIMAL(5,3),
  charge_on_shipping BOOLEAN DEFAULT true,
  is_enabled        BOOLEAN DEFAULT true
);

-- ── 8. Store Promo Codes ────────────────────────────────────────────────────

CREATE TABLE store_promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   TEXT CHECK (discount_type IN ('percentage','fixed')),
  discount_value  DECIMAL(10,2),
  min_order       DECIMAL(10,2),
  max_uses        INTEGER,
  uses_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════════════════════════

-- Payment configs
INSERT INTO store_payment_config (provider, is_enabled) VALUES
  ('stripe',   false),
  ('paypal',   false),
  ('in_store', true);

-- Shipping methods
INSERT INTO store_shipping_methods (name, type, rate, min_order_for_free, is_enabled, display_order) VALUES
  ('Store Pickup',       'pickup',    0,    NULL, true,  0),
  ('Local Delivery',     'flat_rate', 15,   NULL, false, 1),
  ('Standard Shipping',  'flat_rate', 25,   NULL, false, 2),
  ('Free Shipping',      'free',      0,    200,  false, 3);

-- Tax — Ontario HST
INSERT INTO store_tax_config (region, province_code, rate_percent, charge_on_shipping, is_enabled) VALUES
  ('Ontario', 'ON', 13.000, true, true);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE store_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tax_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_promo_codes    ENABLE ROW LEVEL SECURITY;

-- Categories: public read, owner+ write
CREATE POLICY "categories_public_read" ON store_categories
  FOR SELECT USING (true);
CREATE POLICY "categories_auth_write" ON store_categories
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') IN ('owner','admin')
     FROM auth.users WHERE id = auth.uid())
  );

-- Products: public read, owner+ write
CREATE POLICY "products_public_read" ON store_products
  FOR SELECT USING (true);
CREATE POLICY "products_auth_write" ON store_products
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') IN ('owner','admin')
     FROM auth.users WHERE id = auth.uid())
  );

-- Orders: public insert, auth read/update
CREATE POLICY "orders_public_insert" ON store_orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_auth_read" ON store_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_auth_update" ON store_orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Order items: public insert, auth read
CREATE POLICY "order_items_public_insert" ON store_order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_auth_read" ON store_order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Payment config: admin all, owner read
CREATE POLICY "payment_config_admin_all" ON store_payment_config
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') = 'admin'
     FROM auth.users WHERE id = auth.uid())
  );
CREATE POLICY "payment_config_owner_read" ON store_payment_config
  FOR SELECT USING (
    (SELECT (raw_app_meta_data ->> 'user_role') IN ('owner','admin')
     FROM auth.users WHERE id = auth.uid())
  );

-- Shipping methods: admin manage, public read
CREATE POLICY "shipping_public_read" ON store_shipping_methods
  FOR SELECT USING (true);
CREATE POLICY "shipping_admin_manage" ON store_shipping_methods
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') = 'admin'
     FROM auth.users WHERE id = auth.uid())
  );

-- Tax config: admin manage, public read
CREATE POLICY "tax_public_read" ON store_tax_config
  FOR SELECT USING (true);
CREATE POLICY "tax_admin_manage" ON store_tax_config
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') = 'admin'
     FROM auth.users WHERE id = auth.uid())
  );

-- Promo codes: public read, owner+ write
CREATE POLICY "promos_public_read" ON store_promo_codes
  FOR SELECT USING (true);
CREATE POLICY "promos_auth_write" ON store_promo_codes
  FOR ALL USING (
    (SELECT (raw_app_meta_data ->> 'user_role') IN ('owner','admin')
     FROM auth.users WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage Bucket: product-images
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Auth write
CREATE POLICY "product_images_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "product_images_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "product_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers: updated_at
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TRIGGER set_updated_at_store_products
  BEFORE UPDATE ON store_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_store_orders
  BEFORE UPDATE ON store_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

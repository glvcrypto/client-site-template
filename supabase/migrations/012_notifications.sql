-- ============================================================================
-- 012 — Notifications: config, templates, log
-- ============================================================================

-- ── notification_config ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL UNIQUE,
  email_enabled    BOOLEAN DEFAULT true,
  email_to         TEXT,                          -- override recipient (NULL = use site_config email)
  webhook_enabled  BOOLEAN DEFAULT false,
  webhook_url      TEXT,
  webhook_headers_json JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;

-- owner+ can read all configs
CREATE POLICY "notification_config_select" ON notification_config
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

-- owner+ can update email fields
CREATE POLICY "notification_config_update_email" ON notification_config
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

-- admin can do everything (insert/delete for seeding & management)
CREATE POLICY "notification_config_admin_all" ON notification_config
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') = 'admin'
  );

-- ── notification_templates ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL UNIQUE,
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  body_text   TEXT,
  is_customer_facing BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- owner+ full access
CREATE POLICY "notification_templates_owner" ON notification_templates
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') IN ('owner', 'admin')
  );

-- ── notification_log ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('email', 'webhook')),
  recipient     TEXT,
  status        TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  payload_json  JSONB,
  error_message TEXT,
  sent_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_log_sent_at ON notification_log (sent_at DESC);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- admin can read logs
CREATE POLICY "notification_log_admin_read" ON notification_log
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') = 'admin'
  );

-- service role (Edge Functions) can insert — public insert policy
CREATE POLICY "notification_log_insert" ON notification_log
  FOR INSERT WITH CHECK (true);

-- ── Seed notification_config ────────────────────────────────────────────────

INSERT INTO notification_config (event_type, email_enabled, webhook_enabled) VALUES
  ('new_lead',             true, false),
  ('new_order',            true, false),
  ('new_booking',          true, false),
  ('new_review',           true, false),
  ('low_stock',            true, false),
  ('new_message',          true, false),
  ('service_complete',     true, false),
  ('order_status_change',  true, false),
  ('booking_confirmed',    true, false),
  ('review_request',       true, false)
ON CONFLICT (event_type) DO NOTHING;

-- ── Seed notification_templates ─────────────────────────────────────────────

INSERT INTO notification_templates (event_type, subject, body_html, body_text, is_customer_facing) VALUES
  (
    'new_lead',
    'New Lead: {{lead_name}}',
    '<h2>New Lead Received</h2><p><strong>Name:</strong> {{lead_name}}</p><p><strong>Email:</strong> {{lead_email}}</p><p><strong>Phone:</strong> {{lead_phone}}</p><p><strong>Source:</strong> {{lead_source}}</p><p><strong>Message:</strong></p><p>{{lead_message}}</p>',
    'New Lead: {{lead_name}} — {{lead_email}} — {{lead_phone}} — Source: {{lead_source}} — {{lead_message}}',
    false
  ),
  (
    'new_order',
    'New Order #{{order_number}}',
    '<h2>New Order Placed</h2><p><strong>Order:</strong> #{{order_number}}</p><p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p><p><strong>Total:</strong> ${{order_total}}</p><p><strong>Items:</strong> {{item_count}}</p>',
    'New Order #{{order_number}} — {{customer_name}} — ${{order_total}} — {{item_count}} items',
    false
  ),
  (
    'new_booking',
    'New Booking: {{service_name}}',
    '<h2>New Service Booking</h2><p><strong>Service:</strong> {{service_name}}</p><p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p><p><strong>Date:</strong> {{booking_date}}</p><p><strong>Time:</strong> {{booking_time}}</p>',
    'New Booking: {{service_name}} — {{customer_name}} — {{booking_date}} {{booking_time}}',
    false
  ),
  (
    'new_review',
    'New Review from {{reviewer_name}}',
    '<h2>New Review Received</h2><p><strong>From:</strong> {{reviewer_name}}</p><p><strong>Rating:</strong> {{rating}} / 5</p><p><strong>Review:</strong></p><p>{{review_text}}</p>',
    'New Review from {{reviewer_name}} — {{rating}}/5 — {{review_text}}',
    false
  ),
  (
    'low_stock',
    'Low Stock Alert: {{product_name}}',
    '<h2>Low Stock Warning</h2><p><strong>Product:</strong> {{product_name}}</p><p><strong>SKU:</strong> {{product_sku}}</p><p><strong>Remaining:</strong> {{stock_count}} units</p><p>Please restock soon.</p>',
    'Low Stock: {{product_name}} ({{product_sku}}) — {{stock_count}} remaining',
    false
  ),
  (
    'new_message',
    'New Message from {{sender_name}}',
    '<h2>New Message</h2><p><strong>From:</strong> {{sender_name}} ({{sender_email}})</p><p><strong>Subject:</strong> {{message_subject}}</p><p>{{message_body}}</p>',
    'New Message from {{sender_name}} — {{message_subject}} — {{message_body}}',
    false
  ),
  (
    'service_complete',
    'Your Service is Complete — {{service_name}}',
    '<h2>Service Complete</h2><p>Hi {{customer_name}},</p><p>Your <strong>{{service_name}}</strong> service has been completed.</p><p>If you have any questions, please don''t hesitate to reach out.</p><p>Thank you for choosing us!</p>',
    'Hi {{customer_name}}, your {{service_name}} service is complete. Thank you for choosing us!',
    true
  ),
  (
    'order_status_change',
    'Order #{{order_number}} — {{new_status}}',
    '<h2>Order Update</h2><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been updated to: <strong>{{new_status}}</strong>.</p><p>{{status_message}}</p>',
    'Hi {{customer_name}}, your order #{{order_number}} is now {{new_status}}. {{status_message}}',
    true
  ),
  (
    'booking_confirmed',
    'Booking Confirmed — {{service_name}} on {{booking_date}}',
    '<h2>Booking Confirmed</h2><p>Hi {{customer_name}},</p><p>Your booking for <strong>{{service_name}}</strong> has been confirmed.</p><p><strong>Date:</strong> {{booking_date}}</p><p><strong>Time:</strong> {{booking_time}}</p><p><strong>Location:</strong> {{location}}</p><p>We look forward to seeing you!</p>',
    'Hi {{customer_name}}, your {{service_name}} booking is confirmed for {{booking_date}} at {{booking_time}}.',
    true
  ),
  (
    'review_request',
    'How was your experience?',
    '<h2>We''d Love Your Feedback</h2><p>Hi {{customer_name}},</p><p>Thank you for choosing us! We''d appreciate it if you could take a moment to share your experience.</p><p><a href="{{review_url}}">Leave a Review</a></p><p>Your feedback helps us improve and helps others find great service.</p>',
    'Hi {{customer_name}}, we''d love your feedback. Leave a review: {{review_url}}',
    true
  )
ON CONFLICT (event_type) DO NOTHING;

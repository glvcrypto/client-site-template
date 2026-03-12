-- =============================================================================
-- Client Site Template — Seed Data
-- =============================================================================
-- Run this after schema migration to populate the database with demo data.
-- Requires two auth users already created:
--   owner@test.com  (password: testpass123)
--   staff@test.com  (password: testpass123)
-- =============================================================================

-- ── Site Config ──────────────────────────────────────────────────────────────
INSERT INTO site_config (key, value) VALUES
  ('business_name', 'Northern Power & Marine'),
  ('phone', '(705) 253-7828'),
  ('email', 'info@northernpower.ca'),
  ('address', '123 Great Northern Rd, Sault Ste. Marie, ON P6B 4Y8'),
  ('hours', 'Mon-Fri 8:30-5:30 | Sat 9-3 | Sun Closed'),
  ('primary_colour', '#1B2A4A'),
  ('accent_colour', '#D4712A')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── Onboarding Steps ─────────────────────────────────────────────────────────
INSERT INTO client_onboarding_steps (step_key, label, sort_order, completed) VALUES
  ('dns_setup',       'DNS & domain configured',         1, true),
  ('branding',        'Branding assets uploaded',         2, true),
  ('inventory_import','Initial inventory imported',       3, true),
  ('google_setup',    'Google Business Profile claimed',  4, false),
  ('analytics',       'Analytics tracking installed',     5, false),
  ('go_live',         'Site launched & live',             6, false)
ON CONFLICT DO NOTHING;

-- ── Inventory (Dealership Module) ────────────────────────────────────────────
INSERT INTO dealer_inventory (unit_name, unit_type, make, model, year, stock_number, price, cost, condition, status, description, specs, images, listed_date, source) VALUES
  ('2024 Princecraft Vectra 21RL',   'pontoon',        'Princecraft', 'Vectra 21RL',   2024, 'STK-0001', 42999, 36500, 'new',  'featured',   'Luxurious 21-foot pontoon with premium seating, Bluetooth stereo, and ski tow bar. Perfect for lake days with the family.', '{"Length":"21 ft","Beam":"8 ft 6 in","Capacity":"10 persons","Engine":"Mercury 115 EFI"}', '[]', '2026-02-15', 'manual'),
  ('2023 Princecraft Sport 172',     'fishing_boat',   'Princecraft', 'Sport 172',     2023, 'STK-0002', 28500, 24000, 'new',  'available',  'All-aluminium fishing boat built for Northern Ontario waters. Deep-V hull, livewell, and rod storage.', '{"Length":"17 ft 2 in","Beam":"7 ft 10 in","Hull":"Deep-V Aluminium","Livewell":"Yes"}', '[]', '2026-02-20', 'manual'),
  ('Mercury 150 FourStroke',         'outboard_motor', 'Mercury',     '150 FourStroke', 2024, 'STK-0003', 18900, 15500, 'new',  'available',  'Reliable 150 HP four-stroke outboard. Industry-leading fuel economy and low emissions.', '{"HP":"150","Cylinders":"4","Displacement":"3.0L","Shaft":"20 in"}', '[]', '2026-03-01', 'manual'),
  ('Cub Cadet XT1 LT42',            'lawn_mower',     'Cub Cadet',   'XT1 LT42',      2024, 'STK-0004', 2899,  2400,  'new',  'available',  'Riding lawn tractor with 42-inch cutting deck. Kohler engine, hydrostatic transmission.', '{"Engine":"Kohler 5400","Deck":"42 in","Transmission":"Hydrostatic","Fuel Tank":"3.5 gal"}', '[]', '2026-03-01', 'manual'),
  ('Toro Power Max 826 OAE',        'snow_blower',    'Toro',        'Power Max 826 OAE', 2024, 'STK-0005', 1899, 1550, 'new', 'clearance',  'Two-stage snow blower with 26-inch clearing width. Anti-clogging system and electric start.', '{"Engine":"252cc","Clearing Width":"26 in","Intake Height":"21 in","Stages":"2"}', '[]', '2026-01-10', 'manual'),
  ('ECHO CS-590 Timber Wolf',       'chainsaw',       'ECHO',        'CS-590',        2024, 'STK-0006', 599,   480,   'new',  'available',  'Professional-grade 59.8cc chainsaw. Decompression valve, heavy-duty air filter.', '{"Engine":"59.8cc","Bar Length":"20 in","Weight":"13.2 lbs","Chain Brake":"Yes"}', '[]', '2026-03-05', 'manual'),
  ('2022 Princecraft Yukon DLX',     'fishing_boat',   'Princecraft', 'Yukon DLX',     2022, 'STK-0007', 19900, 16000, 'used', 'available',  'Pre-owned aluminium fishing boat in excellent condition. One owner, low hours.', '{"Length":"16 ft","Hours":"120","Hull":"Aluminium","Trailer":"Included"}', '[]', '2026-02-28', 'manual'),
  ('E-Z-GO RXV Golf Cart',          'golf_cart',      'E-Z-GO',      'RXV',           2023, 'STK-0008', 8500,  7000,  'demo', 'available',  'Demo unit electric golf cart. 48V AC drive, headlights, tail lights. Barely used.', '{"Drive":"48V AC","Seating":"2","Top Speed":"19 mph","Charger":"Included"}', '[]', '2026-03-01', 'manual')
ON CONFLICT DO NOTHING;

-- ── Leads ────────────────────────────────────────────────────────────────────
INSERT INTO portal_leads (name, email, phone, lead_type, source, status, message, landing_page, response_time_minutes) VALUES
  ('Mark Thompson',    'mark.t@email.com',     '705-555-0101', 'quote_request',   'google_organic', 'new',         'Interested in the Princecraft Vectra pontoon. Can I come see it this weekend?', '/inventory', NULL),
  ('Sarah Leclair',    'sarah.l@email.com',    '705-555-0102', 'service_request',  'direct',        'contacted',   'Need my lawn tractor serviced before spring. Cub Cadet XT1.', '/contact', 45),
  ('Dave Robinson',    'dave.r@email.com',     '705-555-0103', 'financing',        'facebook',      'quoted',      'Looking at financing options for a new fishing boat. Budget around $30K.', '/financing', 30),
  ('Lisa Chen',        'lisa.c@email.com',     '705-555-0104', 'contact',          'google_organic', 'new',        'Do you carry Humminbird fish finders? Looking for the Helix 7.', '/contact', NULL),
  ('Tom Whitfield',    NULL,                    '705-555-0105', 'trade_in',         'referral',      'negotiating', 'Want to trade my 2019 Princecraft for something bigger. What do you have?', '/inventory', 15),
  ('Angela Morrison',  'angela.m@email.com',   NULL,           'quote_request',    'google_ads',    'won',         'Purchased the ECHO CS-590. Great service!', '/inventory', 20),
  ('Brad Kowalski',    'brad.k@email.com',     '705-555-0107', 'service_request',  'direct',        'new',         'Snow blower won''t start. Toro Power Max. Bought it here last year.', '/contact', NULL),
  ('Jennifer Russo',   'jen.r@email.com',      '705-555-0108', 'financing',        'facebook',      'lost',        'Was looking at financing but found a deal elsewhere. Thanks anyway.', '/financing', 60)
ON CONFLICT DO NOTHING;

-- ── Services (Dealership Module) ─────────────────────────────────────────────
INSERT INTO dealer_services (service_type, customer_name, customer_email, customer_phone, unit_description, status, scheduled_date, notes) VALUES
  ('pre_season_inspection',   'Mark Thompson',   'mark.t@email.com',  '705-555-0101', 'Princecraft Sport 172',     'scheduled',    '2026-03-20', NULL),
  ('lawn_tractor_tune_up',    'Sarah Leclair',   'sarah.l@email.com', '705-555-0102', 'Cub Cadet XT1 LT42',       'received',     NULL,          NULL),
  ('winterization_outboard',  'Pete Harrison',   NULL,                 '705-555-0201', 'Mercury 90 EFI',            'complete',     '2026-01-15', NULL),
  ('chainsaw_service',        'Jim Bouchard',    'jim.b@email.com',   '705-555-0202', 'ECHO CS-590',               'in_progress',  '2026-03-10', NULL),
  ('snowthrower_service',     'Brad Kowalski',   'brad.k@email.com',  '705-555-0107', 'Toro Power Max 826 OAE',   'received',     NULL,          NULL),
  ('golf_cart_service',       'Karen Mitchell',  'karen.m@email.com', '705-555-0203', 'E-Z-GO RXV',               'scheduled',    '2026-03-25', NULL),
  ('oil_change_io',           'Dave Robinson',   'dave.r@email.com',  '705-555-0103', 'Princecraft Yukon DLX',     'picked_up',    '2026-02-28', NULL)
ON CONFLICT DO NOTHING;

-- ── Message Threads ──────────────────────────────────────────────────────────
INSERT INTO portal_message_threads (id, subject, category, status, last_message_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Website launch timeline',          'general',           'open',     '2026-03-10 14:30:00+00'),
  ('00000000-0000-0000-0000-000000000002', 'Inventory photos needed',          'inventory_request', 'open',     '2026-03-09 10:00:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'Monthly report feedback',          'support',           'resolved', '2026-03-05 16:00:00+00')
ON CONFLICT DO NOTHING;

-- ── Messages ─────────────────────────────────────────────────────────────────
INSERT INTO portal_messages (thread_id, sender_role, body, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Hi! Your site is looking great. We are targeting next Monday for the soft launch. Sound good?', '2026-03-10 14:00:00+00'),
  ('00000000-0000-0000-0000-000000000001', 'owner', 'Sounds perfect. Can we add a few more inventory photos before then?', '2026-03-10 14:30:00+00'),
  ('00000000-0000-0000-0000-000000000002', 'admin', 'We need photos for the Princecraft Vectra and the E-Z-GO cart. Can you snap some this week?', '2026-03-09 09:00:00+00'),
  ('00000000-0000-0000-0000-000000000002', 'owner', 'Will do! I will get those over by Thursday.', '2026-03-09 10:00:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'admin', 'Here is your February report. Let us know if you have any questions.', '2026-03-05 15:00:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'owner', 'Looks great, thanks! Happy with the traffic numbers.', '2026-03-05 16:00:00+00')
ON CONFLICT DO NOTHING;

-- ── Client Updates ───────────────────────────────────────────────────────────
INSERT INTO client_updates (title, body, update_type, is_pinned) VALUES
  ('Website Soft Launch Scheduled',      'Your new website is ready for a soft launch on March 17. We will monitor performance and make adjustments during the first week.', 'milestone',    true),
  ('Inventory Module Live',              'The dealership inventory system is now active. You can add, edit, and manage units from the admin portal.', 'deliverable',  false),
  ('SEO Foundations Complete',            'Meta tags, structured data, and sitemap have been configured. Google Search Console is set up and indexing has been requested.', 'status',       false),
  ('Service Board Added',                'The service tracking kanban board is now available in your portal. Use it to manage customer service requests through the pipeline.', 'deliverable',  false),
  ('Monthly Reporting Setup',            'Automated monthly reports will be generated starting April 1. They will include traffic, lead, and conversion data.', 'note',         false)
ON CONFLICT DO NOTHING;

-- ── Client Reports ───────────────────────────────────────────────────────────
INSERT INTO client_reports (title, report_month, report_type, summary, highlights) VALUES
  ('February 2026 Monthly Report', '2026-02', 'monthly', 'Strong first month with the new site. Organic traffic is building and the inventory pages are getting good engagement.', '["412 total page views","8 new leads generated","Average session duration: 2m 45s","Top page: /inventory"]'),
  ('Q4 2025 Quarterly Review',      '2025-Q4', 'quarterly', 'Pre-launch quarter focused on site build, content creation, and SEO foundations.', '["13 service pages created","Site architecture finalised","Google Business Profile submitted","Brand guidelines documented"]')
ON CONFLICT DO NOTHING;

-- ── Activity Log ─────────────────────────────────────────────────────────────
INSERT INTO portal_activity_log (entity_type, action, summary, entity_id) VALUES
  ('lead',      'created',  'New lead: Mark Thompson (quote request via Google)',    NULL),
  ('lead',      'created',  'New lead: Sarah Leclair (service request)',             NULL),
  ('lead',      'updated',  'Dave Robinson moved to Quoted',                         NULL),
  ('lead',      'updated',  'Angela Morrison marked as Won',                         NULL),
  ('inventory', 'created',  'Added 2024 Princecraft Vectra 21RL (STK-0001)',        NULL),
  ('inventory', 'created',  'Added 8 units to inventory',                            NULL),
  ('service',   'created',  'New service: Pre-season inspection for Mark Thompson',  NULL),
  ('service',   'updated',  'Chainsaw service for Jim Bouchard moved to In Progress', NULL),
  ('message',   'created',  'New thread: Website launch timeline',                   NULL),
  ('report',    'created',  'February 2026 monthly report published',                NULL)
ON CONFLICT DO NOTHING;

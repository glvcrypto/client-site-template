# Client Site Template

## Creating a New Client Site

### 1. Create from Template

On GitHub: **glvcrypto/client-site-template** > "Use this template" > "Create a new repository"

Name it: `glvcrypto/<client-slug>` (e.g., `glvcrypto/reyco-marine`)

### 2. Clone and Install

```bash
git clone https://github.com/glvcrypto/<client-slug>.git
cd <client-slug>
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) > New Project
2. Name: `<client-slug>` | Region: `ca-central-1`
3. Copy the project URL and anon key

### 4. Run Migrations

Apply the three migrations in order from `supabase/migrations/`:

```
001_core_tables.sql
002_dealership_module.sql
003_rls_and_triggers.sql
```

Run via Supabase SQL Editor or CLI.

### 5. Create Auth Users

In Supabase SQL Editor:

```sql
-- Owner account
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
VALUES (
  gen_random_uuid(), 'owner@clientdomain.com',
  crypt('SECURE_PASSWORD', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"user_role":"owner"}'::jsonb,
  '{"full_name":"Owner Name"}'::jsonb,
  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
);
```

### 6. Configure Environment

```bash
cp .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 7. Seed Site Config

```sql
INSERT INTO site_config (key, value) VALUES
  ('business_name', '"Client Business Name"'),
  ('phone', '"705-XXX-XXXX"'),
  ('email', '"info@clientdomain.com"'),
  ('address', '"123 Main St, Sault Ste Marie, ON"'),
  ('primary_color', '"#1e3a5f"'),
  ('tagline', '"Your tagline here"');
```

### 8. Customise

- Update `index.html` title and meta tags
- Replace logo/images in `public/`
- Adjust colours in site_config
- Modify public pages for the client's industry

### 9. Deploy

Recommended: Cloudflare Pages

```bash
npm run build   # outputs to dist/
```

Connect repo to Cloudflare Pages, set build command `npm run build`, output dir `dist`.

---

## Syncing Template Updates

To pull improvements from the base template into an existing client site:

```bash
# One-time: add template as upstream remote
git remote add template https://github.com/glvcrypto/client-site-template.git

# Pull updates
git fetch template
git merge template/master --allow-unrelated-histories

# Resolve conflicts (client customisations take priority)
# Commit and push
```

---

## Module System

The template ships with the **Dealership Module** (inventory, services, analytics). Future modules:

- **Contractor Module** — project gallery, estimates, scheduling
- **Restaurant Module** — menu, reservations, specials
- **Professional Services Module** — appointments, case studies

Modules are additive SQL migrations + React pages. Enable/disable by including/excluding the relevant migration and routes.

---

## Mission Control Integration

Each client site can connect to GLV Mission Control for aggregate reporting:

1. Add the client's Supabase service role key to Mission Control's `clients` table
2. Mission Control reads data via service role (bypasses RLS)
3. No client-side changes needed

---

## Tech Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4 + shadcn/ui (New York, Zinc)
- Supabase (Auth + PostgreSQL + RLS)
- TanStack Query v5 + TanStack Router
- Recharts + Lucide React

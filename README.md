# VELORA — Beauty, Fashion & Accessories

An Arabic-first, RTL e-commerce application built with Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/Storage, Zod, React Hook Form, Recharts, and Lucide React.

## Requirements

- Node.js 20.19 or later within 20.x, 22.13 or later within 22.x, or 24 or later (use a current LTS release).
- npm 10 or later.
- A Supabase project for authentication, orders, wholesale workflows, administration, and image uploads.

## Install and run

~~~powershell
npm install
Copy-Item .env.example .env.local
npm run dev
~~~

On macOS or Linux, use `cp .env.example .env.local` for the copy step.

Open http://localhost:3000. With no Supabase values, the storefront runs with the sample catalog and a browser-persisted cart/wishlist. Authentication, checkout, merchant applications, and admin actions remain unavailable until a Supabase project is configured.

Useful checks:

~~~bash
npm run typecheck
npm run lint
npm run build
npm audit
~~~

## Supabase setup

1. Create a Supabase project.
2. Copy the Project URL and publishable key (or legacy anon key) into .env.local:

   ~~~dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ~~~

   The publishable/anon key is designed for browser use and is protected by RLS. Never set the service-role key as a NEXT_PUBLIC_ variable. The application does not use a service-role key.

3. In the Supabase SQL Editor, run supabase/migrations/0001_velora_platform.sql, then supabase/seed.sql for the sample catalog. The migration creates the tables, indexes, signup trigger, checkout and admin RPCs, RLS policies, and public image buckets with admin-only upload/update/delete rules.
4. In Supabase Authentication settings, enable the desired email confirmation flow and add http://localhost:3000/** as a local redirect URL. Add the production origin before deployment.
5. Restart npm run dev after changing environment values.

Supabase’s official [Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) and [SSR client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client) describe the cookie-backed session setup used here.

## Create the first administrator

1. Register a normal account through /register and complete email confirmation if enabled.
2. As the Supabase project owner, open the SQL Editor and run this trusted administrative statement with the account’s exact email:

   ~~~sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('admin@example.com')
     and is_active = true;
   ~~~

The browser has no privilege to change role or is_active. Do not expose SQL editor or service-role credentials to application users. Later administrators should be assigned only by an existing trusted project administrator.

## Main routes

- /, /shop, /categories/[slug], /products/[slug], /search
- /login, /register, /account, /account/orders, /account/wishlist
- /cart, /checkout, /about, /contact, /wholesale
- /admin and admin sections for products, categories, orders and order details, inventory, customers and customer details, wholesale applications, coupons, reviews, and store settings

## Security and operational notes

- Server operations use the authenticated Supabase session and verify the profile role; RLS remains the data boundary for direct Supabase access.
- Checkout sends product IDs and quantities only. PostgreSQL reloads prices, checks merchant approval, applies coupons and shipping, locks stock rows, rejects overselling, records movements, creates the COD payment record, and writes the order in one transaction.
- Wholesale pricing is omitted from normal product column grants. The database returns it only to an approved merchant through a role-checked RPC.
- Registration creates customer accounts only. Assigning an administrator role is a trusted SQL-editor operation.
- Uploads use Supabase Storage with image MIME and size limits; public reads are enabled for product imagery, while writes and deletions require an active admin profile.
- Online payment is intentionally unavailable until a supported payment provider is integrated. No card data is collected or stored. Cash on delivery is the only accepted method.
- Checkout has both an in-process request limiter and a database-side per-user order limit. The in-process limiter is best-effort in multi-instance/serverless hosting; use a shared edge limiter for a high-traffic production deployment.
- Change the seeded contact details, social URLs, free-shipping threshold, product copy, product images, and legal policies before launch. The sample imagery is illustrative.
- The sample demo catalog and local-storage cart do not create real orders. A configured Supabase database is required for purchase and account workflows.

## Project structure

~~~text
app/                 App Router pages and protected API routes
components/           Storefront, forms, product, cart, and admin UI
lib/                  Catalog/data access, auth, validation boundaries, Supabase clients
lib/query-types.ts    Typed database result shapes used by server-rendered admin pages
supabase/migrations/  PostgreSQL schema, RLS, RPCs, Storage policies
supabase/seed.sql     Sample categories, brands, products, and stock
public/               Static assets
~~~

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

   The publishable/anon key is designed for browser use and is protected by RLS. Guest checkout also needs `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) as a server-only runtime secret. It is used only by checkout and confirmation server routes; never name it with a `NEXT_PUBLIC_` prefix, send it to the browser, or commit its value.

3. In the Supabase SQL Editor, run migrations in numeric order (`0001_velora_platform.sql`, then `0002_guest_checkout.sql`), then run `supabase/seed.sql` if you need the sample catalog. Review and approve migrations before applying them to production.
4. In Supabase Authentication > URL Configuration, set Site URL to the production store origin (`https://velora.tha950130.workers.dev`). Add these Redirect URLs:
   - `https://velora.tha950130.workers.dev/auth/callback`
   - `http://localhost:3000/auth/callback`
   The callback exchanges a Supabase PKCE code for a secure session cookie.
5. In Supabase Authentication > Sign In / Providers > Email, turn off **Allow new users to sign up** to block direct Supabase Auth signups. The application registration page is disabled too, but that page alone cannot disable Supabase's Auth API.
6. Restart npm run dev after changing environment values.

Supabase’s official [Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) and [SSR client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client) describe the cookie-backed session setup used here.

## Cloudflare Workers deployment

This project includes an OpenNext adapter configuration for Cloudflare Workers. The `WORKER_SELF_REFERENCE` service name in `wrangler.jsonc` must stay identical to the Worker `name`; changing one requires changing the other.

For Cloudflare Workers Builds, use:

- Production branch: `main`
- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`
- Root directory: `/`
- Preview branch build command: `npx @opennextjs/cloudflare build`
- Preview command: `npx wrangler preview`

The OpenNext build command must run before either deploy command: `npm run build` alone only creates Next.js output and does not generate `.open-next/worker.js`. Keep the `previews` block in `wrangler.jsonc` so Wrangler can create preview deployments.
Cloudflare's **Retry build** can reuse the commands recorded for an earlier attempt. After changing the Cloudflare Build settings, push a new commit to the pull request branch to start a fresh preview build with the updated commands.

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Worker build/runtime environment settings using the values from the Supabase project. Add `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) as a Cloudflare Worker secret for server runtime use. In Supabase Authentication > URL Configuration, use the deployed `workers.dev` origin as Site URL and allow the exact `/auth/callback` URL documented above. The URL/publishable key are intended for browser use and RLS protects direct database access; the server secret must remain server-only. Keep `.env.local` and `.dev.vars` out of Git.

The OpenNext adapter currently warns that local Windows support is incomplete; the Cloudflare build environment runs Linux. The original Netlify deployment remains independent. Test the Cloudflare preview and production URL from both Wi-Fi and mobile data before sharing it as the store link. Cloudflare's current recommended Next.js path, vinext, is still marked beta; this project instead uses the OpenNext adapter that successfully built the application in the Cloudflare deployment log.

## Create the first administrator

1. From Supabase Authentication, send an invitation to the administrator's email address and complete the invitation. Public registration is disabled in the application and should also be disabled in Supabase Auth settings.
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
- Public registration is disabled in the application. The Supabase Auth signup setting must also be turned off in the dashboard; existing users and administrators can continue to sign in.
- Uploads use Supabase Storage with image MIME and size limits; public reads are enabled for product imagery, while writes and deletions require an active admin profile.
- Online payment is intentionally unavailable until a supported payment provider is integrated. No card data is collected or stored. Cash on delivery is the only accepted method.
- Signed-in checkout has an in-process request limiter and a database-side per-user order limit. Guest checkout uses an atomic, persistent database rate limit keyed by a server-derived, secret-keyed Cloudflare network hash. Coupon limits for guests use the same hash, so changing a phone number does not reset them.
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

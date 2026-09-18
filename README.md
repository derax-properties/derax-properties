# Derax Properties

A production-ready Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase website for
Derax Properties: a public marketing site with a working "Sell Your Property" lead form, a
public property catalog with investor inquiries, and a password-protected admin dashboard (CRM)
for managing leads, properties, and inquiries.

## What's included

- **Public site**: Home, About, Services, Properties (with filters), Property detail pages,
  Sell Your Property (6-step form), Contact, Privacy Policy, Terms, Disclaimer.
- **Sell Your Property**: a real multi-step form that validates input, uploads photos/documents,
  writes to Supabase, emails your team, emails the seller a confirmation, and issues a reference
  number (`DP-YYYY-XXXXXX`).
- **Admin dashboard** (`/admin`, auth-protected): summary cards, seller lead management (search,
  filter, sort, status, assignment, notes, CSV export, click-to-call/email, photo & document
  viewing via signed URLs), investor inquiry management, contact message management, property
  management (create/edit/delete, photo uploads, publish/unpublish), and site settings.
- **Database & security**: full Postgres schema with Row Level Security so that anonymous
  visitors can only ever *insert* a lead/inquiry/message — never read anyone else's data — and
  only authenticated admins can read or manage records. See `supabase/schema.sql` and
  `supabase/policies.sql`.
- **SEO**: metadata, Open Graph tags, canonical URLs, `robots.txt` (`app/robots.ts`) and a
  dynamic `sitemap.xml` (`app/sitemap.ts`) that includes live property pages.

## Before this can go live, you need to provide

This code cannot run without your own accounts for the services below — there is no way around
that for a real backend, and no credentials are hard-coded anywhere in the app.

1. **A Supabase project** (free tier is fine to start) — the database, file storage, and admin
   login all run on it.
2. **A Resend account** (optional, free tier available) — for email notifications. If you skip
   this, the site still works and every submission still saves to the database; you just won't
   get an email alert.
3. **A phone number** and **social media URLs** — placeholders are used until you provide them
   (see `.env.example` and the footer/admin settings).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy the **Project URL**, **anon public key**, and
   **service_role key**.
3. In the **SQL Editor**, run `supabase/schema.sql`, then `supabase/policies.sql`, in that order.
4. (Optional) Run `supabase/seed.sql` to add four sample properties so the homepage and
   `/properties` page aren't empty while you're developing.
5. In **Storage**, create three buckets:
   - `seller-photos` — **private**
   - `seller-documents` — **private**
   - `property-photos` — **public** (these are meant to be seen by site visitors)
6. In **Authentication → Users**, click **Add User** to create your first admin login (email +
   password). Then in the SQL Editor, run:
   ```sql
   insert into admin_profiles (id, full_name, role)
   values ('<the new user''s UUID from the Users table>', 'Your Name', 'owner');
   ```
   Repeat for any teammate who needs dashboard access.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values from step 2. If you set up Resend, add `RESEND_API_KEY` too.

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin` to sign in
with the admin account you created.

## Deploying

This is a standard Next.js app — it deploys cleanly to Vercel (recommended), or any host that
runs Next.js. Set the same environment variables from `.env.local` in your hosting provider's
dashboard. Update `NEXT_PUBLIC_SITE_URL` to your real domain once you have one, so the sitemap,
Open Graph tags, and email links point to the right place.

## Project structure

```
app/                     Pages and API routes (Next.js App Router)
  admin/                 Admin dashboard (auth-protected via middleware.ts)
  api/                   Route handlers: seller submissions, uploads, inquiries, contact
  properties/[slug]/     Dynamic property detail pages
  sell-your-property/    The 6-step seller form
components/              Reusable UI components (Header, Footer, cards, form fields, etc.)
components/admin/        Admin-only components (tables, forms, uploaders)
lib/                     Supabase clients, validation (zod), email (Resend), types, utils
supabase/                schema.sql, policies.sql, seed.sql — run these in the SQL editor
middleware.ts            Protects every /admin/* route except /admin/login
```

## Notes on content and claims

Per the brand guidelines this site was built to, the copy throughout intentionally avoids
guaranteeing an offer, a specific price, brokerage licensing, or a physical office address —
none of that was provided, so none of it is claimed. Update copy in `app/about/page.tsx`,
`app/privacy-policy/page.tsx`, `app/terms/page.tsx`, and `app/disclaimer/page.tsx` once you have
real details (a licensed status, an address, etc.) to add.

Property photography is placeholder (a branded gradient) until you upload real photos through
the admin dashboard — the code never fabricates or hotlinks stock photography.

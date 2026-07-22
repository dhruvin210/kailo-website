
# Kailo — Build Plan

A 12-page e-commerce site is large. I'll deliver it in phases so you see a polished, working site quickly, then layer in commerce + admin. Stack notes below use this project's actual stack (TanStack Start, not React Router DOM) and Lovable Cloud (not raw Supabase) — these are functionally equivalent and required for this template.

## Phase 1 — Foundation & Marketing Site (this turn)

- Design system in `src/styles.css`: Kailo teal `#1AACB0`, soft bg, dark text, Fraunces display + DM Sans body via Google Fonts, pill radius, card radius.
- Global Navbar (sticky, logo SVG, nav links, login pill, mobile drawer) + Footer (dark, 4-column).
- Kailo SVG logo (teal circle + white swirl).
- Routes (TanStack file-based) with per-route SEO meta:
  - `/` Home — hero, featured product carousel (auto-play), category grid, "Why Kailo" features, best sellers grid, testimonials, newsletter CTA.
  - `/about` — hero banner, story, mission/values, team, timeline.
  - `/products` — filter bar (category, price, sort), responsive product grid, empty state.
  - `/products/$id` — gallery, info, variant/qty, tabs (desc/specs/reviews), related products.
  - `/gallery` — masonry + lightbox + filter tabs.
  - `/contact` — form (RHF + Zod), info cards, FAQ accordion.
- Seed 12 products as static data (Unsplash imagery) so catalogue is browsable immediately.
- Cart context (localStorage), add-to-cart with toast, navbar cart badge.
- Framer Motion: staggered hero, card hover lift, page fade.
- Back-to-top button, 404 page already exists.

## Phase 2 — Auth, Cart, Checkout (next turn)

- Enable Lovable Cloud (Supabase under the hood). Create `profiles`, `products`, `orders`, `reviews`, `wishlists`, `contact_submissions`, `newsletter_subscribers`, `user_roles` (separate roles table for security).
- RLS + GRANTs on every table. Seed products into DB.
- `/login`, `/signup` (email + password), session persistence, protected route layout `_authenticated`.
- `/account` with Profile / Orders / Wishlist / Addresses / Password tabs.
- `/cart` + `/checkout` multi-step (Shipping → Payment placeholder → Review → Confirmation), order written to DB.
- Wire contact form + newsletter to DB.

## Phase 3 — Admin & Polish

- `/admin` gated by `has_role(auth.uid(),'admin')`: KPIs, products CRUD, orders management, gallery uploads (Storage), customers.
- Global search dropdown in navbar.
- Loading skeletons, error states, a11y pass (focus rings, ARIA, alt text), final QA.

## Technical notes (template-specific deviations from your prompt)

- **Routing:** TanStack Router (file-based in `src/routes/`), not React Router DOM. Same UX, different API.
- **Backend:** Lovable Cloud (managed Supabase) — auth, Postgres, Storage all included; no external account needed.
- **SEO:** TanStack's `head()` per route, not react-helmet (SSR-correct).
- **Payments:** Stripe is a placeholder UI in Phase 2; wiring real Stripe is a separate step if you want it.
- **Roles:** stored in a dedicated `user_roles` table with a `has_role` SECURITY DEFINER function (required to avoid RLS recursion and privilege-escalation).

## What I'll ask before Phase 2

Confirm enabling Lovable Cloud, and whether you want real Stripe checkout or just the placeholder UI from your spec.

Reply "go" (or with changes) and I'll start Phase 1.

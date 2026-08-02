# Kailo CMS

Headless CMS for the Kailo site. **Strapi 5** (TypeScript) on **PostgreSQL**.

Everything the frontend renders — products, categories, gallery, and the copy
on every page — is modelled here as content types defined **in code**
(`src/api/**/schema.json` + `src/components/**/*.json`) and pre-seeded from the
values currently hardcoded in `frontend`. A clean clone against an empty
Postgres reaches the fully populated state with no clicking in the admin panel.

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Content model](#content-model)
- [API — what the frontend should call](#api--what-the-frontend-should-call)
- [Permissions](#permissions)
- [Seeding](#seeding)
- [Media](#media)
- [Going to production](#going-to-production)
- [Known gaps](#known-gaps)

---

## Prerequisites

| | |
|---|---|
| **Node** | 18, 20 or 22 — `.nvmrc` pins 22. `nvm use` |
| **npm** | 9+ |
| **PostgreSQL** | 14+. Use the repo-root `docker-compose.yml`, or point at an instance you already run. SQLite is not supported. |

## Quick start

```bash
cd cms
npm install
cp .env.example .env
```

Fill in the six secrets in `.env`. Six one-liners:

```bash
node -e "const c=require('crypto'),b=n=>c.randomBytes(n).toString('base64');
console.log('APP_KEYS='+[b(16),b(16),b(16),b(16)].join(','));
console.log('API_TOKEN_SALT='+b(16));
console.log('ADMIN_JWT_SECRET='+b(16));
console.log('TRANSFER_TOKEN_SALT='+b(16));
console.log('JWT_SECRET='+b(16));
console.log('ENCRYPTION_KEY='+c.randomBytes(16).toString('hex'));"
```

### Start Postgres

**Option A — Docker (nothing installed locally).** The compose file lives at the
repo root, not in this folder, because it also builds the CMS image:

```bash
cd ..
cp .env.example .env      # database credentials — see the root .env.example
docker compose up -d db   # Postgres only; drop `db` to run the CMS too
```

This starts `postgres:16-alpine` on port 5432 with the database, user and
password from the **root** `.env` — not this folder's. Keep `DATABASE_NAME`,
`DATABASE_USERNAME` and `DATABASE_PASSWORD` here matching it, or Strapi
authenticates against a database created with different credentials.

The SQL in `infrastructure/db/` runs once, while the volume is still empty. Data
lives in the `kailo-pgdata` volume and survives `docker compose down`; add `-v`
to wipe it.

**Option B — an existing Postgres.** Create the role and database, then point
`DATABASE_*` at it:

```sql
CREATE ROLE kailo LOGIN PASSWORD 'your_password';
CREATE DATABASE kailo OWNER kailo;
```

**Option C — hosted Postgres** (Render, Railway, Supabase, Neon, Heroku). Set
`DATABASE_URL` to the connection string they give you plus:

```
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

`DATABASE_URL` takes precedence over the discrete `DATABASE_*` vars.

### Run it

```bash
npm run develop
```

Strapi creates its tables, reconciles the Public role's permissions, and — on a
database that has never been seeded — runs the full content seed. Watch for
`[seed] done in …s` in the log.

Then open **http://localhost:1337/admin** and create the first admin user. That
account is local to your machine; there is no default login.

Sanity check:

```bash
curl -s "http://localhost:1337/api/products?populate=*" | head -c 400
curl -s "http://localhost:1337/api/home-page" | head -c 400
```

> **Port note.** 1337 is Strapi's convention and the committed default. On this
> workstation it is squatted by Razer's `RzSDKServer` (it grabs `127.0.0.1:1337`
> whenever the port frees up), so the local `.env` sets `PORT=1338` instead. If
> you hit *"The port 1337 is already used by another application"*, find the
> holder and either stop it or pick another port:
>
> ```powershell
> Get-NetTCPConnection -LocalPort 1337 -State Listen |
>   ForEach-Object { Get-Process -Id $_.OwningProcess }
> ```
>
> Whatever port you land on, `VITE_STRAPI_URL` in the frontend has to match.

## Scripts

| Script | What it does |
|---|---|
| `npm run develop` | Dev server with autoreload and the content-type builder enabled |
| `npm run build` | Build the admin panel for production |
| `npm start` | Production server (run `build` first) |
| `npm run seed` | Re-run the content seed against the current database |
| `npm run console` | Interactive Strapi REPL |

## Content model

### Components

| Component | Fields |
|---|---|
| `shared.spec` | `label`, `value` |
| `shared.seo` | `metaTitle`, `metaDescription`, `ogImage`, `canonicalUrl` |
| `shared.cta` | `heading`, `body`, `buttonLabel`, `buttonHref`, `secondaryButtonLabel`, `secondaryButtonHref` |
| `shared.feature` | `icon`, `title`, `body` |
| `shared.faq` | `question`, `answer` |
| `shared.contact-detail` | `icon`, `label`, `value` |
| `shared.social-link` | `platform` (`Instagram` \| `Twitter` \| `Facebook` \| `Youtube`), `url` |
| `shared.nav-link` | `label`, `href` |
| `home.hero-slide` | `image`, `alt`, `position` |
| `home.hero-stat` | `value`, `label` |
| `home.category-tile` | `name`, `tagline`, `image`, `href`, `categoryFilter`, `position`, `feature`, `comingSoon` |
| `home.gallery-tile` | `image`, `alt`, `tall` |
| `home.testimonial` | `quote`, `name`, `role`, `location`, `initials`, `rating` |
| `about.material` | `name`, `meta`, `body`, `image` |

Every `icon` field holds a **lucide-react component name as a string**
(`Sparkles`, `Music`, `Truck`, `Heart`, `Globe`, `Mail`, `Phone`, `MapPin`,
`Clock`, `Scissors`, `Backpack`, `Layers`, `Plane`, `Home`, `GraduationCap`).
The frontend maps the string to a component through an explicit allowlist in
`src/lib/icons.ts` — a name that is not in it renders `Sparkles`, so add it
there first.

### Collection types

| Type | Endpoint | Notes |
|---|---|---|
| **Category** | `/api/categories` | 3 seeded, one flat level — one per product line: Ukulele Bags, Ukulele Straps, Ukuleles (coming soon, no products yet). Bag size and strap material are `specs` on the product, not categories, and they are what set price: tenor ₹5,000 / concert ₹4,500 bags, denim ₹600 / suede and NDM leather ₹800 straps. `name` is unique and is what `?category=` filters on. |
| **Product** | `/api/products` | 6 seeded. `slug` matches the old frontend `id` exactly. `price` is a whole-rupee **integer**. Draft & publish on. |
| **Gallery Image** | `/api/gallery-images` | 30 seeded. `category` is `Products` \| `Lifestyle` \| `Events` — "All" is a UI-only filter and is deliberately not stored. `order` preserves the layout from `gallery.tsx`. |
| **Newsletter Subscription** | `/api/newsletter-subscriptions` | Form capture. Public `create` only. `email` unique. |
| **Contact Submission** | `/api/contact-submissions` | Form capture. Public `create` only. `handled` is server-owned and cannot be set from outside. Nothing is sent anywhere — submissions are read in the admin panel. |
| **Cart** | `/api/carts/token/:cartToken` | Anonymous carts mirrored from the storefront, keyed by a browser-generated `cartToken`, so a `?cart=<token>` link rehydrates on another device. **No `find` and no `delete` route exists** — see [Permissions](#permissions). |

### Single types

| Type | Endpoint | Mirrors |
|---|---|---|
| **Global** | `/api/global` | `Navbar.tsx` + `Footer.tsx` — brand, nav links, footer links, social, contact block, copyright |
| **Home Page** | `/api/home-page` | `routes/index.tsx` — hero carousel, spirit/story, categories, gallery, best sellers, testimonials, newsletter |
| **About Page** | `/api/about-page` | `routes/about.tsx` — hero, story, materials, craft details, values, audiences, CTA |
| **Contact Page** | `/api/contact-page` | `routes/contact.tsx` — hero, contact details, workshop block, FAQs, CTA |

## API — what the frontend should call

Strapi 5 populates **nothing** by default. Rather than make every caller
hand-write a three-level populate, a global middleware
([`src/middlewares/default-populate.ts`](src/middlewares/default-populate.ts))
fills in a per-endpoint default when the request omits `populate` **or** passes
the alias `populate=deep`:

```
GET /api/home-page                 → full payload
GET /api/home-page?populate=deep   → full payload (identical; explicit alias)
GET /api/home-page?populate=seo    → exactly what you asked for
```

That file is the single source of truth for what "everything" means per
endpoint. The queries the frontend should send:

| Page | Request |
|---|---|
| Layout (nav + footer) | `GET /api/global` |
| Home | `GET /api/home-page` |
| About | `GET /api/about-page` |
| Contact | `GET /api/contact-page` |
| Products list | `GET /api/products?sort=name:asc&pagination[pageSize]=100` |
| Products, filtered | `GET /api/products?filters[category][name][$eq]=Ukulele%20Bags` |
| Product detail | `GET /api/products?filters[slug][$eq]=leather-ukulele-bag-brown` |
| Category pills | `GET /api/categories?sort=order:asc` |
| Gallery | `GET /api/gallery-images?sort=order:asc&pagination[pageSize]=100` |
| Gallery, filtered | `GET /api/gallery-images?filters[category][$eq]=Lifestyle&sort=order:asc` |

Three notes on that table:

- **Product detail is a filtered list, not `findOne`.** Strapi 5 addresses
  entries by `documentId`, and the frontend's route param is the slug. Filter on
  `slug` and take `data[0]`.
- **`pagination[pageSize]=100`.** The REST default page size is 25 and the
  gallery has 30 images. `maxLimit` is raised to 200 in `config/api.ts` so a
  whole collection always fits in one page.
- **Testing these with `curl` needs `-g`.** curl treats `[` and `]` as glob
  syntax and will refuse the URL otherwise:
  `curl -sg "http://localhost:1337/api/gallery-images?pagination[pageSize]=100"`.

Writes:

```
POST /api/newsletter-subscriptions   { "data": { "email": "…", "source": "home-newsletter" } }
POST /api/contact-submissions        { "data": { "name": "…", "email": "…", "subject": "…", "message": "…" } }

PUT  /api/carts/token/:cartToken             { "data": { "items": [ … ] } }
GET  /api/carts/token/:cartToken             → line items, subtotal, status
POST /api/carts/token/:cartToken/recovered   → status: recovered
```

All unauthenticated. See [INTEGRATION.md](INTEGRATION.md) for the exact
request/response shapes and the honeypot field.

The cart endpoints have **patch semantics** — a key you omit keeps its stored
value — and `subtotal`, `status`, `lastActivityAt` and `recoveredAt` are all
server-derived and ignored in a request body.

### CORS

Origins come from env, so a deploy never needs a code change:

- `FRONTEND_URL` — the primary origin (default `http://localhost:8080`, which is
  the port `frontend/vite.config.ts` pins the dev server to).
- `FRONTEND_URLS` — comma-separated extras. Put the Vercel production and
  preview URLs here.

`localhost`/`127.0.0.1` on ports 8080, 3000 and 5173 are always allowed on top,
so the dev server works regardless of how it is started.

## Permissions

Reconciled **on every boot** by
[`src/seed/permissions.ts`](src/seed/permissions.ts), so the public API surface
lives in code rather than in whoever-clicked-what:

| Content type | Public role |
|---|---|
| product, category, gallery-image | `find`, `findOne` |
| home-page, about-page, contact-page, global | `find` |
| newsletter-subscription, contact-submission | `create` **only** |
| cart | `upsertByToken`, `findByToken`, `markRecovered` — the token-scoped custom actions only |

Nothing grants Public `find` on the submission types or on carts, so form captures
are not readable over the API — admins read them in the panel. Anything the table
marks as disabled is actively **revoked** on boot, so a permission granted by hand
in the admin does not silently persist.

The one public write this table does *not* cover is
`POST /api/auth/local/register`, which is not a Public-role permission at all —
see [Accounts](#accounts). It is forced off on the same boot pass.

For carts the guarantee is stronger than a revoked permission.
[`src/api/cart/routes/cart.ts`](src/api/cart/routes/cart.ts) is a hand-written
router, so `find` and `delete` **do not exist as routes at all** — there is no
checkbox in the admin to tick by accident, and `GET /api/carts` is a 404 rather
than a 403. `permissions.ts` still lists the core five as `false` as a standing
assertion, so swapping in `createCoreRouter` later would revoke them on the next
boot instead of quietly exposing every cart in the database.

### Spam control

[`src/middlewares/public-form-guard.ts`](src/middlewares/public-form-guard.ts)
guards every publicly writable endpoint with:

1. A **honeypot** — a hidden `company` field. Filled means bot: 200 back, nothing
   written, so it does not retry. Forms only; the cart sync is not a form and has
   no such field.
2. A per-IP **fixed-window throttle**, with separate budgets because the two kinds
   of endpoint are nothing alike:

| Paths | Limit |
|---|---|
| `POST /api/contact-submissions`, `POST /api/newsletter-subscriptions` | `PUBLIC_FORM_MAX_SUBMISSIONS` (5) per `PUBLIC_FORM_WINDOW_MS` (60 s) |
| `PUT`/`POST` under `/api/carts/` | `CART_WRITE_MAX` (60) per `CART_WRITE_WINDOW_MS` (60 s) |

A contact form submitted six times in a minute is a bot; a cart PUT sent sixty
times in a minute is one shopper adjusting quantities behind a 1.5 s debounce.
Sharing one budget would either wave the bot through or break the cart. The cart
key is the *matched prefix*, not the request path — keying on the path would give
every fresh token its own budget, which is no limit at all.

The counter is in-process. That is the right trade for a single instance;
**behind a load balancer or on more than one dyno it under-counts** — move the
limit to Redis, or to the CDN/WAF layer.

## Seeding

The seed lives in [`src/seed/`](src/seed/) and is **idempotent** — run it as
often as you like:

- Categories and products upsert on `slug`; gallery images upsert on `order`.
- Single types upsert "the one document".
- Media uploads are keyed by a stable file `name`, so images are not duplicated.
- Everything is written with `status: 'published'`, so the public API returns it
  immediately.
- A prune step runs first, since upserts alone never remove anything: it deletes
  the slugs in `RETIRED_CATEGORY_SLUGS` / `RETIRED_PRODUCT_SLUGS`, the uploads in
  `RETIRED_ASSET_NAMES` (files under `public/uploads` included), and any gallery
  row whose `order` is past the end of the current list. It names what it removes
  explicitly, so content you added in the admin is left alone.

Two ways to run it:

```bash
npm run seed        # any time, against the current database
```

or automatically on first boot — `src/index.ts` calls `runSeedOnce`, which is
guarded by a `SEED_VERSION` flag in Strapi's core store. It runs once and then
never again unless you bump `SEED_VERSION` in `src/seed/index.ts`. Set
`SEED_ON_BOOT=false` to opt out entirely.

**Re-seeding overwrites editorial changes** for the fields it manages. That is
deliberate: `src/seed/data.ts` is the canonical copy.

## Media

`src/seed/data.ts` names images by logical key; `src/seed/assets.ts` maps those
keys to files and uploads them.

**Local originals** (~40 images: `hero1–4`, `gallery1/3/4/5/6`, `photo01–24`,
three product PNGs, four lifestyle PNGs, the logo) are read from
`../frontend/src/assets` — **once, at seed time.** The running server
never touches that folder; after seeding, the Media Library owns its own copies
under `public/uploads`. Override the location with `KAILO_ASSETS_DIR` if your
checkout differs or you have vendored the images.

**Remote originals.** Some product images are still Unsplash URLs, as they were in
`frontend/src/lib/products.ts`. The seed downloads and uploads them so the
CMS owns the files. If a download fails (offline, rate-limited), the seed logs a
warning, continues, and records the URL in the product's `remoteImageUrl` /
`remoteGalleryUrls` fields as a fallback — re-run `npm run seed` when you are
back online and the real files replace it.

### Switching the upload provider

Local disk is the default and writes to `public/uploads`. **Those files do not
survive a redeploy on an ephemeral or serverless host**, and when they go, every
image on the site 404s — so pick a remote provider before the first real deploy.

The swap is env-only; `config/plugins.ts` builds the provider block from
`UPLOAD_PROVIDER`. Install the package, set the credentials:

**S3**

```sh
npm install @strapi/provider-upload-aws-s3
```

```
UPLOAD_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=…
AWS_ACCESS_SECRET=…
AWS_REGION=ap-south-1
AWS_BUCKET=kailo-media
CDN_URL=https://cdn.kailo.com   # optional: CloudFront in front of the bucket
```

**Cloudinary**

```sh
npm install @strapi/provider-upload-cloudinary
```

```
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_NAME=…
CLOUDINARY_KEY=…
CLOUDINARY_SECRET=…
CDN_HOSTS=res.cloudinary.com
```

Naming a provider without its package installed fails at boot with the exact
`npm install` you need, rather than a module-resolution stack trace.

`CDN_URL` and `CDN_HOSTS` also feed the `img-src` / `media-src` CSP directives in
`config/middlewares.ts` — set at least one of them, or the admin's media library
fills with broken thumbnails once assets move off this origin. The frontend needs
no change: `mediaUrl` passes absolute URLs through untouched.

**Migrating existing files.** Switching the provider does not move what is already
in `public/uploads`. Copy the folder to the bucket preserving filenames, then
rewrite the `url` column of the `files` table to the new origin — content relations
key on file IDs, so nothing else needs touching.

### Optimising the media library

```sh
npm run media:optimize          # dry run — reports the projected saving
npm run media:optimize -- --apply
```

Converts every raster upload (and each of its derivatives) to WebP with `sharp`,
then repoints the `files` row at the new file. Strapi's own breakpoints are no help
for PNG sources — sharp re-encodes PNG as PNG, so `large_hero1.png` came out
*larger* than the 1.1 MB original.

The WebP is written **alongside** the original; nothing is deleted, so the migration
is reversible by restoring the `url` / `formats` columns. Runs are idempotent, skip
SVGs and anything already WebP, and touch no content — prices, copy and relations
are all untouched. Local provider only: once files live on S3 or Cloudinary,
transformation is the provider's job.

## Going to production

1. **Postgres** — set `DATABASE_URL`, `DATABASE_SSL=true` and
   `DATABASE_SSL_REJECT_UNAUTHORIZED=false`. Raise `DATABASE_POOL_MAX` to match
   what your provider allows.
2. **Secrets** — generate fresh values for all six. Never reuse the dev ones.
3. **`PUBLIC_URL`** — set it to the API's public origin so upload URLs are
   absolute and correct behind a proxy.
4. **CORS** — set `FRONTEND_URL` to the production site and list preview
   deployments in `FRONTEND_URLS`.
5. **Uploads** — switch to S3 or Cloudinary. Local disk does not survive a
   redeploy on ephemeral filesystems (Heroku, Render free tier, Fly).
6. **Seed** — leave `SEED_ON_BOOT=true` for the first deploy so production comes
   up populated, then consider setting it to `false`.
7. **Rate limiting** — move the in-process throttle to Redis or the CDN if you
   run more than one instance.
8. **`NODE_ENV=production`** — set it in the host's environment. `npm start`
   without it boots in `development`, which the startup banner will tell you.
9. **Sign-ups** — nothing to do; `POST /api/auth/local/register` is forced off on
   every boot (see [Accounts](#accounts) below). Set `USERS_ALLOW_REGISTER=true`
   only once there is an auth phase for accounts to belong to.
10. **Backups** — set up the nightly dump and prove a restore before go-live, not
    after. Runbook: [`docs/backup-recovery.md`](../docs/backup-recovery.md).
11. **Build** — `npm run build && npm start`.

Backup, restore, rollback and the dependency-upgrade posture all live in
[`docs/backup-recovery.md`](../docs/backup-recovery.md).

### Accounts

`POST /api/auth/local/register` is **disabled**, reconciled on every boot by
[`configureSignups`](src/seed/permissions.ts) alongside the Public-role table.

It needs its own reconciliation because it is not a Public-role permission and
not a config file value: the switch is `allow_register` inside the
users-permissions plugin's advanced settings, a row in the core store that the
plugin seeds to `true` on first boot. `register: { allowedFields: [] }` in
`config/plugins.ts` does not close it — that only narrows which fields a sign-up
may set, leaving the route open. Left at its default, anyone could mint confirmed
accounts and JWTs on this instance, and `public-form-guard` would not throttle it:
that middleware matches the two form paths and the cart prefix, not this one.

## Known gaps

- **`/gallery` page copy** (the hero eyebrow, "Moments with Kailo" heading and
  subtext, plus the filter pill labels) has no home in the content model — there
  is no `gallery-page` single type. It stays hardcoded in `routes/gallery.tsx`.
  Adding one is a ~20-line schema plus a seed block if you want it.
- **Auth, wishlist, checkout, orders** are deliberately not modelled. The wishlist
  stays client-side as it is today; commerce is a future phase.
- **The cart is mirrored, not owned.** localStorage remains the source of truth and
  the storefront never reads back from the CMS during normal use; the `cart`
  collection exists so a `?cart=<token>` link can rehydrate on another device. Two
  gaps that only a checkout can close:
  - **Recovery is not detected.** `markRecovered` is implemented and unused: a cart
    going quiet looks identical whether they bought here, bought elsewhere, or lost
    interest.
  - **A `cartToken` is the only identity there is.** Anyone holding one can read
    and write that cart, so a leaked `?cart=` link exposes its contents. There is
    nothing personal stored on the row alongside them.
- **Nothing is sent to anyone.** There is no outbound email and no WhatsApp
  integration: a contact submission is a row in the admin panel and someone
  replies by hand. Both were removed rather than left disabled.
- The frontend has drifted from the original content brief in a few places
  (6 testimonials rather than 3, 3 category tiles rather than 4, no "Why Kailo"
  band, no newsletter section on the homepage). The seed follows **the
  frontend**, since that is what actually ships. The `whyEyebrow` / `whyHeading`
  / `features` and `newsletter` fields are modelled and seeded anyway, so those
  sections can be switched back on from the CMS without a schema change.

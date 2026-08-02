# Frontend integration

How `frontend` consumes this API. The reads and both forms are wired —
`src/lib/strapi.ts` is the fetch layer, `src/lib/queries.ts` the queries,
`src/lib/normalize.ts` the mapping, and `src/lib/cartSync.ts` the cart mirror.
This document is the contract between the two, so keep it in step when either
side moves.

- [1. Environment](#1-environment)
- [2. A typed fetch helper](#2-a-typed-fetch-helper)
- [3. Mapping table](#3-mapping-table)
- [4. Things that stay on the frontend](#4-things-that-stay-on-the-frontend)
- [5. Wiring the two forms](#5-wiring-the-two-forms)
- [6. Cart persistence](#6-cart-persistence)
- [7. Out of scope](#7-out-of-scope)

---

## 1. Environment

Add to `frontend/.env`:

```
VITE_STRAPI_URL=http://localhost:1337
```

Match whatever port the CMS is actually on — `cms/.env` on this
workstation uses **1338**, because Razer's `RzSDKServer` squats on 1337 (see the
port note in the README).

`vite.config.ts` already forwards every `VITE_`-prefixed var into
`import.meta.env` for both the client and SSR bundles, so no config change is
needed. In production point it at the deployed CMS.

Media URLs in the payload are **root-relative** with the local upload provider
(`/uploads/hero1.png`), so they need the base prefixed. They become absolute
once you move to S3/Cloudinary — the helper below handles both.

## 2. A typed fetch helper

`src/lib/strapi.ts`:

```ts
const BASE = import.meta.env.VITE_STRAPI_URL ?? "http://localhost:1337";

/** Strapi wraps every response in { data, meta }. */
type StrapiResponse<T> = { data: T; meta: unknown };

export type StrapiImage = {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats: Record<string, { url: string; width: number; height: number }> | null;
};

export async function strapi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Strapi ${res.status} on ${path}: ${body}`);
  }

  const json = (await res.json()) as StrapiResponse<T>;
  return json.data;
}

/** Uploads are root-relative on the local provider, absolute on S3/Cloudinary. */
export const mediaUrl = (image: StrapiImage | null | undefined): string =>
  !image ? "" : image.url.startsWith("http") ? image.url : `${BASE}${image.url}`;
```

Use it inside TanStack Router `loader`s so pages server-render with content
already in hand:

```ts
export const Route = createFileRoute("/")({
  loader: () => strapi<HomePage>("/home-page"),
  component: Home,
});
```

**You do not need to pass `populate`.** A server-side middleware fills in a
full per-endpoint populate when the query omits it. `?populate=deep` is
accepted as an explicit alias. Pass an explicit `populate` only when you
deliberately want *less*.

## 3. Mapping table

### Products — `src/lib/products.ts`

`GET /api/products?sort=name:asc&pagination[pageSize]=100`

| Frontend field | Strapi field | Note |
|---|---|---|
| `id` | `slug` | e.g. `leather-ukulele-bag-brown`, `denim-ukulele-strap` |
| `name` | `name` | |
| `category` | `category.name` | Relation, not a string. `"Ukulele Bags"`, `"Ukulele Straps"`, `"Ukuleles"` |
| `price` | `price` | **Integer rupees.** Do not divide. |
| `rating` | `rating` | Decimal |
| `reviews` | `reviews` | |
| `image` | `mainImage` | `mediaUrl(product.mainImage)` |
| `images` | `gallery` | `product.gallery.map(mediaUrl)` |
| `description` | `description` | |
| `specs` | `specs[]` | `{ label, value }` — identical shape |
| `badge` | `badge` | `"NEW"` \| `"SALE"` \| `null` |
| `stock` | `stock` | |
| — | `remoteImageUrl`, `remoteGalleryUrls` | Fallback only. Non-null means the seed could not download that Unsplash original; use it when `mainImage` is null. |

`CATEGORIES` becomes `GET /api/categories?sort=order:asc`. The `"All"` pill is
UI-only — keep prepending it client-side.

**Product detail** — the route param is a slug, and Strapi 5 addresses entries
by `documentId`, so `findOne` is the wrong call:

```ts
const [product] = await strapi<Product[]>(
  `/products?filters[slug][$eq]=${encodeURIComponent(id)}`,
);
```

### Home — `src/routes/index.tsx`

`GET /api/home-page`

| Frontend const | Strapi field |
|---|---|
| `heroSlides` | `heroSlides[]` → `{ image, alt, position }` |
| `heroStats` | `heroStats[]` → `{ value, label }` |
| hero copy | `heroEyebrow`, `heroHeadingLine1`, `heroHeadingLine2`, `heroSubtext` |
| hero buttons | `heroPrimaryCtaLabel` / `Href`, `heroSecondaryCtaLabel` / `Href` |
| `spiritChips` | `storyChips` (JSON array of strings) |
| Kailo Spirit copy | `storyEyebrow`, `storyHeading`, `storyBody`, `storyBodySecondary` |
| `storyImage`, `artisanImage` | `storyImage`, `storyInsetImage` |
| the floating stat card | `storyStatValue`, `storyStatLabel` |
| "Read our story" link | `storyCtaLabel`, `storyCtaHref` |
| `categories` | `categoryTiles[]` → `{ name, tagline, image, href, categoryFilter, position, feature }` |
| `galleryTiles` | `homeGallery[]` → `{ image, alt, tall }` |
| `bestSellers` | `bestSellers[]` — a real relation to Product. Seeded with the four most-reviewed, matching the current `sort(reviews).slice(0,4)`. Fall back to that computation if the array is empty. |
| `testimonials` | `testimonials[]` → `{ quote, name, role, location, initials, rating }` |
| section headings | `categoriesEyebrow` / `Heading`, `galleryEyebrow` / `Heading` / `Description`, `bestSellersEyebrow` / `Heading` / `Description`, `testimonialsEyebrow` / `Heading` / `Description` |
| — | `whyEyebrow`, `whyHeading`, `features[]` — modelled and seeded but **not currently rendered**. The "Why Kailo" band was removed in the redesign; the data is here if it comes back. |
| — | `newsletter` (`shared.cta`) — same story. Seeded, not currently rendered. |

`route.head()` meta comes from `seo`: `metaTitle`, `metaDescription`,
`ogImage`, `canonicalUrl`.

### About — `src/routes/about.tsx`

`GET /api/about-page`

| Frontend const | Strapi field |
|---|---|
| hero copy | `heroEyebrow`, `heroHeadingLine1`, `heroHeadingLine2`, `heroSubtext`, `heroImage` |
| story copy | `storyEyebrow`, `storyHeading`, `storyLead` (the opening paragraph, set full width with a drop cap), `storyParagraphs` (JSON array — the paragraphs beside the image), `storyPullQuote`, `storyImage` |
| story chips | `storyChips` (JSON array) |
| the floating accent card | `storyStatValue`, `storyStatLabel` |
| `materials` | `materials[]` → `{ name, meta, body, image }` — the three the catalogue is filed under. `meta` reuses each category's own tagline. |
| the workshop band | `craftEyebrow` / `Heading` / `Description`, `craftImage`, `craftDetails[]` → `{ icon, title, body }` (`shared.feature`) |
| `values` | `values[]` → `{ icon, title, body }` — `Icon` becomes the string `icon` |
| `audiences` | `audiences[]` → `{ icon, title, body }` (`shared.feature` again) |
| closing CTA | `cta` → `{ heading, body, buttonLabel, buttonHref, secondaryButtonLabel, secondaryButtonHref }` |
| section headings | `materialsEyebrow` / `Heading` / `Description`, `valuesEyebrow` / `Heading`, `audienceEyebrow` / `Heading` / `Description` |

The story copy is the owner's, used **verbatim** — em-dashes and apostrophes
included. `storyPullQuote` must stay an exact substring of `storyLead` or
`storyParagraphs`; it is a pull-quote, not a new sentence. The same four
paragraphs are duplicated as the fallback in `about.tsx`, so edit both together.

Every band except the story is **skipped entirely** when its repeatable comes
back empty, rather than rendering a heading over nothing. The story falls back
to that hardcoded copy, because an empty prose column would leave a hole beside
a full-height image.

The "Meet the team" and "Milestones" bands were cut in the redesign, along with
the `team` / `milestones` fields and the `about.team-member` / `about.milestone`
components that backed them. Their placeholder names and dates contradicted the
story, and nothing real was available to replace them with.

### Contact — `src/routes/contact.tsx`

`GET /api/contact-page`

| Frontend const | Strapi field |
|---|---|
| hero copy | `heroEyebrow`, `heroHeading`, `heroSubtext`, `heroImage` |
| `DETAILS` | `contactDetails[]` → `{ icon, label, value }` |
| the `subject` `<select>` | `formSubjects` (JSON array). Keep the zod enum in sync — the server also validates and falls back to `"General Inquiry"`. |
| the workshop block | `workshopImage`, `workshopLabel`, `workshopLocation`, `workshopDirectionsUrl` |
| — | `mapEmbedUrl` — optional Google Maps embed src, if you swap the photo for an `<iframe>` |
| `FAQS` | `faqs[]` → `{ question, answer }` (`f.q`/`f.a` become `question`/`answer`) |
| section headings | `faqEyebrow`, `faqHeading` |
| closing CTA | `cta` |

### Gallery — `src/routes/gallery.tsx`

`GET /api/gallery-images?sort=order:asc&pagination[pageSize]=100`

`IMAGES` becomes the response. `img.src` → `mediaUrl(item.image)`,
`img.cat` → `item.category`, and `alt` is now real text on the record rather
than a template string. Keep `"All"` as a client-side pill.

The gallery page's own hero copy has **no** CMS home — see "Known gaps" in the
README.

### Layout — `Navbar.tsx` / `Footer.tsx`

`GET /api/global`

| Frontend | Strapi field |
|---|---|
| `LINKS` in `Navbar.tsx` | `navLinks[]` → `{ label, href }` |
| Footer Quick Links | `footerQuickLinks[]` |
| Footer Products column | **not** in `global` — use `GET /api/categories?sort=order:asc` and link to `/products?category={name}` |
| Footer social icons | `socialLinks[]` → `{ platform, url }`; `platform` is also the lucide icon name |
| Footer contact list | `contactEmail`, `contactPhone`, `contactAddress`, `contactHours` |
| Footer tagline | `tagline` |
| Bottom bar | `copyright` |
| `Logo.tsx` | `logo`, `logoLight` |

### Pagination

The REST default page size is 25 and `maxLimit` is 200. Products (6) and
categories (3) fit by default; **gallery images (30) do not** — always pass
`pagination[pageSize]=100` there.

## 4. Things that stay on the frontend

**`formatINR` does not move.** `price` is an integer number of rupees; format it
client-side exactly as today:

```ts
export const formatINR = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
```

**Lucide icons are stored as strings.** `icon` fields hold a component name, not
markup. Map them with an explicit allowlist — never `LucideIcons[name]` on
untrusted input:

```ts
import { Clock, Globe, Heart, Mail, MapPin, Music, Phone, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Sparkles, Music, Truck, Heart, Globe, Mail, Phone, MapPin, Clock,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Sparkles;
```

The seed only ever writes those nine names.

## 5. Wiring the two forms

Both endpoints are unauthenticated and accept `{ data: { … } }`.

### Newsletter

```ts
await fetch(`${BASE}/api/newsletter-subscriptions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: { email, source: "home-newsletter" } }),
});
```

- `201` — subscribed. Body: `{ data: { documentId, alreadySubscribed: false } }`
- `200` — already on the list. Body: `{ data: { alreadySubscribed: true } }`.
  **Show the same success toast**; a repeat sign-up is not an error.
- `400` — invalid email.
- `429` — throttled. `Retry-After` header holds the seconds.

### Contact

Wired through `submitContactForm` in `src/lib/strapi.ts`, which the `onSubmit` in
`routes/contact.tsx` calls:

```ts
POST /api/contact-submissions
{ "data": {
    "name": "…", "email": "…", "subject": "…", "message": "…",
    "company": ""                 // honeypot, always sent explicitly
} }
```

- `201` — saved. Body: `{ data: { documentId } }`.
- `400` — validation failed; the message is human-readable.
- `429` — throttled. `Retry-After` header holds the seconds.

Server-side validation mirrors the zod schema (name ≥ 2, valid email, message
≥ 20) and returns `400` on failure. `subject` is validated against the four
allowed values and falls back to `"General Inquiry"`. `handled` is server-owned
and cannot be supplied.

The `201` is the end of it. **Nothing is sent to anyone** — no acknowledgement
email, no WhatsApp notice — so the success toast must not promise a confirmation
that never arrives. The submission is a row someone reads in the admin panel and
answers by hand.

### The honeypot

Both endpoints check a hidden `company` field. Render it in each form,
hidden from humans and from screen readers:

```tsx
<input
  type="text"
  name="company"
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
  className="absolute left-[-9999px] h-0 w-0 opacity-0"
/>
```

A non-empty `company` gets `200` back and nothing is written — the bot sees
success and does not retry. Send `company: ""` explicitly, as above.

Rate limit: 5 submissions per IP per minute per endpoint, then `429`. Cart writes
have their own, much looser budget — see below.

## 6. Cart persistence

The cart is **mirrored** to the CMS so a `?cart=<token>` link can rehydrate it on a
device that has never seen it. localStorage stays the source of truth:
`src/lib/cart.tsx` is unchanged in shape and behaviour, nothing on the page reads
back from the CMS during normal use, and every call in `src/lib/cartSync.ts`
swallows its own failures. A CMS that is down costs the shopper nothing.

Three endpoints, all keyed by a `cartToken` the browser generates once
(`crypto.randomUUID`) and keeps in localStorage:

```
PUT  /api/carts/token/:cartToken             mirror the cart (create or update)
GET  /api/carts/token/:cartToken             read it back, for a ?cart= link
POST /api/carts/token/:cartToken/recovered   mark it converted
```

```ts
PUT /api/carts/token/aaaa1111-…
{ "data": {
    "items": [{ "slug": "…", "name": "…", "qty": 2, "price": 2499, "image": "https://…" }]
} }
```

Four things to know before calling it:

- **Patch semantics.** A key you omit keeps its stored value. To *clear* a field,
  send it explicitly empty.
- **Derived fields are ignored.** `subtotal` is recomputed from the line items
  server-side, and `lastActivityAt` is stamped from the server clock rather than
  trusted from a device. `status` and `recoveredAt` are not writable at all.
- **`GET` returns line items, subtotal and status**, and nothing else. The token
  travels in a `?cart=` link, so a leaked link exposes a shopping list — and there
  is nothing personal on the row to expose beside it.
- **There is no `find` and no `delete`.** Those routes are not declared, so
  `GET /api/carts` is a `404`.

Rate limit: 60 cart writes per IP per minute (`CART_WRITE_MAX`), because one
shopper adjusting quantities behind a 1.5 s debounce legitimately produces far more
requests than a form does.

`?cart=<token>` on `/cart` carries a cart across devices. `routes/cart.tsx`
validates it, then `adoptCart` merges the remote line items into the local cart —
taking the higher quantity per item rather than the sum, since this is one cart
seen from two devices — and adopts the token so both sides converge on one row.

`markCartRecovered` is implemented and **nothing calls it yet**: recovery cannot be
inferred without an order, since clearing a cart and completing one are the same
event to this code. A future checkout's success page is the one honest caller.

## 7. Out of scope

- **Wishlist** stays exactly as it is — `src/lib/wishlist.ts` is localStorage-backed
  client state and nothing here changes that.
- **Auth, checkout, orders** are a future phase. Nothing is scaffolded for them:
  no user content types beyond Strapi's built-in Users & Permissions, no order
  model, no payment config.

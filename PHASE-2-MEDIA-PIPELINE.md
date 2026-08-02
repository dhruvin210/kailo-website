# Build Prompt — Phase 2: Media Pipeline & Deploy-Ready Uploads

Run from the repo root (the folder containing `frontend/` and `cms/`).
Phase 1 (wiring the frontend to Strapi) is complete; this phase makes the images
it now serves fast, and the upload layer deployable.

---

## ROLE & GOAL

The frontend reads all content from Strapi, which means it also serves every image
straight from the CMS at full size. Measured on the homepage:

| File | Served size |
|---|---|
| `hero1.png` … `hero4.png` | **1.05–1.11 MB each** |
| `large_hero1.png` (Strapi's own derivative) | **1.5 MB — larger than the original** |
| `photo07.jpeg` (brand story) | 672 KB |
| Homepage total | **20 media requests, ~4.4 MB of hero alone** |

Strapi's breakpoint derivatives are useless for these because sharp re-encodes PNG
as PNG. The whole media library is **72 MB across 252 files**.

Two goals, in this order:

1. **Make the bytes small** — convert the library to WebP and have the frontend
   request the right size for the viewport. Target: homepage hero under 200 KB,
   total homepage media under 1 MB, with no visible quality loss.
2. **Make uploads deployable** — local disk is the default provider, so on any
   ephemeral or serverless host the files vanish on redeploy and every image 404s.
   Selecting a provider must become env-only, as `cms/README.md` already
   promises but the code does not deliver.

**Do not change the visual design.** Same crops, same focal points, same layout,
same animations. This is a bytes-and-plumbing phase; if a page looks different
afterwards, something is wrong.

---

## 0. GROUND TRUTH

- `mediaUrl(media, format?)` in `frontend/src/lib/strapi.ts` already selects a
  derivative with graceful fallback (`large → medium → small → thumbnail → original`).
  Almost nothing uses the argument yet — only the About team portraits pass `"small"`.
- Strapi 5 returns `formats` as `{ large, medium, small, thumbnail }`, each with its
  own `url`, `width`, `height`. Small uploads only have the sizes above their
  threshold, so **every consumer must tolerate a missing format** — that is what
  `mediaUrl`'s fallback chain is for.
- Breakpoints are configured in `cms/config/plugins.ts`:
  `large: 1000, medium: 750, small: 500`.
- `sharp` 0.34.5 resolves inside `cms` (Strapi's upload plugin depends on it).
- Content relations reference **file IDs**, not URLs. Rewriting a file's row in the
  `files` table therefore preserves every relation and every edit made in the admin.
- The admin has hand-edited content (e.g. `guitar-case` is priced ₹10,059, not the
  seed's ₹17,999). **Nothing in this phase may re-seed or overwrite content.**
- CSP in `cms/config/middlewares.ts` restricts `img-src`/`media-src` to
  `'self'` plus `market-assets.strapi.io`.

---

## 1. ENV-DRIVEN UPLOAD PROVIDER (`cms`)

`config/plugins.ts` hardcodes the local provider. Make the choice env-driven:

- `UPLOAD_PROVIDER=local | aws-s3 | cloudinary`, defaulting to `local` so local
  development is untouched.
- Build the provider block conditionally, reading the same env names the README and
  `.env.example` already document (`AWS_*`, `CLOUDINARY_*`, `CDN_URL`).
- Keep `sizeLimit` and `breakpoints` shared across all providers.
- The provider SDK is **not** a dependency — `@strapi/provider-upload-aws-s3` and
  `@strapi/provider-upload-cloudinary` install only when selected. If a provider is
  named without its package present, fail at boot with a message that says which
  `npm install` is missing rather than a bare module-resolution error.

In `config/middlewares.ts`, add the CDN host to `img-src`/`media-src` from env
(`CDN_URL`, plus a comma-separated `CDN_HOSTS` for extras), mirroring how
`FRONTEND_URL` / `FRONTEND_URLS` already drive CORS. Without it the admin's media
library shows broken thumbnails the moment a provider is enabled.

Update `.env.example` and the README's "Switching the upload provider" section so
they describe the env-only swap that now actually exists.

---

## 2. WEBP MIGRATION SCRIPT (`cms`)

Add `npm run media:optimize` — a standalone script that converts the existing media
library to WebP **without touching content**.

For every image row in the `files` table:

1. Encode a WebP of the original and of each existing derivative with `sharp`
   (quality ~80, `effort` high). Skip anything already WebP, and skip SVGs.
2. Write the new files **alongside** the originals in `public/uploads` — never
   delete or overwrite source files, so the whole migration is reversible.
3. Update the row in place: `url`, `ext`, `mime`, `size`, `width`/`height`, and the
   `formats` JSON, each pointing at its WebP counterpart.

Requirements:

- **Dry-run by default.** Print a per-file before/after table and the projected
  total saving. Only `--apply` writes files or touches the database.
- **Idempotent** — a second `--apply` run must be a no-op, not a re-encode.
- Skip a file rather than abort the run when sharp cannot read it; report skips.
- Report the real total at the end: files converted, bytes before, bytes after.
- Local provider only. Say so plainly if `UPLOAD_PROVIDER` is not `local`, since
  remote files are the provider's business, not the script's.

---

## 3. RESPONSIVE IMAGES (`frontend`)

Add `mediaSrcSet(media)` to `src/lib/strapi.ts`: build a `srcSet` string from
whichever formats exist, each with its real pixel width descriptor, plus the
original as the widest candidate. Return `undefined` when there is nothing to
choose between, so `<img>` falls back to plain `src`.

Apply `srcSet` + an honest `sizes` to every CMS image, with `sizes` reflecting the
actual layout at each breakpoint — not a copy-pasted `100vw`:

| Where | Notes |
|---|---|
| Homepage hero slides | Full-bleed. First frame stays `eager` + `fetchPriority="high"` (it is the LCP element); the rest stay lazy, and the 1.2 s prewarm must request the same URL the browser would pick, not the original. |
| Category bento tiles | Half-width on mobile, quarter on desktop, feature tile double-width. |
| Home gallery tiles + brand story images | |
| `/gallery` masonry | Four columns on desktop. |
| `ProductCard`, product detail main image + thumbnails | Thumbnails want `thumbnail`, not the original. |
| About hero / story / team, Contact hero / workshop | |

Keep every `objectPosition`, `aspect-*` class, `loading`, `decoding` and
`fetchPriority` attribute exactly as it is. `alt` text keeps coming from
`mediaAlt(...)`.

---

## 4. VERIFICATION

1. `npm run media:optimize` dry-run reports a projected saving; `--apply` delivers
   it; a second `--apply` reports nothing left to do.
2. Re-measure the homepage: hero frame under 200 KB, total media under 1 MB. Report
   real before/after numbers, not estimates.
3. Every route still 200s and every image still resolves — no 404s from a rewritten
   URL, no broken thumbnail in the admin media library.
4. `tsc --noEmit` clean, `npm run build` green, no new lint errors.
5. Spot-check that the CMS content is untouched: `guitar-case` still ₹10,059, the
   hand-edited hero slides still in place.
6. Confirm `UPLOAD_PROVIDER=local` (the default) behaves exactly as before.

---

## OUT OF SCOPE

- Provisioning an actual S3 bucket or Cloudinary account, or committing credentials.
  Config and docs only; the deploy itself is the operator's step.
- Auth, checkout, orders, payments — the next phase.
- The `order` field on Product, the missing Products/Gallery single types, and the
  fabricated reviews on the product detail page. All real gaps, all separate.
- Any change to page layout, copy, or motion.

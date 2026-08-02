# Kailo — Phased Page Redesign

Bringing the four secondary pages up to the homepage (`src/routes/index.tsx`) design language. One phase at a time; review after each.

## Design system (source of truth: homepage)

- **Stack:** TanStack Start, React 19, Tailwind v4, shadcn/ui, Framer Motion, lucide-react. Wrap pages in `<SiteLayout>`. Use TanStack Router `Link` for internal links.
- **Type:** headings `font-display` (Fraunces); body `font-sans` (DM Sans). Section headings `text-4xl font-semibold md:text-5xl`.
- **Eyebrow label:** `text-sm font-semibold uppercase tracking-[0.3em] text-primary`.
- **Color:** primary teal `#1AACB0`. Alternate white (`bg-background`) / `bg-[var(--bg-soft)]`. Tokens only — never hard-coded hex.
- **Rhythm:** sections `py-24`; container `mx-auto max-w-7xl px-6 lg:px-8`.
- **Shape:** cards `rounded-3xl border border-border bg-card`; hover lift `hover:-translate-y-1 hover:shadow-xl`; pill buttons with sliding arrow (`group-hover:translate-x-1`).
- **Motion:** shared `reveal` — `initial {opacity:0,y:24}`, `whileInView {opacity:1,y:0}`, `viewport {once:true, margin:"-80px"}`, ease `[0.22,1,0.36,1]`, stagger `delay: i*0.08`.
- **Assets:** real photos at `src/assets/gallery/photo01..24.jpeg` + `gallery1..6.jpeg`.

## Progress

- [x] **Phase 1 — About** (`src/routes/about.tsx`) — cinematic hero, scroll-reveal story, numbered value cards, team, milestones, teal CTA. ✅ typecheck clean, awaiting review.
- [x] **Phase 2 — Products** (`src/routes/products.tsx`) — header pattern, pill filters, staggered grid, empty state. ✅ typecheck clean, awaiting review.
- [x] **Phase 3 — Gallery** (`src/routes/gallery.tsx`) — intro header, refined masonry, lazy images, polished lightbox. ✅ typecheck clean, awaiting review.
- [x] **Phase 4 — Contact** (`src/routes/contact.tsx`) — restyled form + detail cards, map block, FAQ accordion, teal CTA. ✅ typecheck clean, awaiting review.

**All four phases complete.** Full site now matches the homepage design language.

> **Superseded for Contact.** `src/routes/contact.tsx` was rebuilt and no longer
> matches the Phase 4 description. It is three bands:
>
> 1. **Hero** — full-bleed on the dark navy, built on the *homepage's* treatment
>    rather than About's light one: left-to-right black grade, vignette, film
>    grain, white type, image-drifts-down / copy-lifts-and-fades parallax. Its
>    image is `hero2`, one of the four wide carousel frames, because those are the
>    only 16:9 originals in the library. Stacks image-over-copy below `lg`.
> 2. **Enquiry** — details and the form side by side on `--bg-soft`, with three
>    quick-contact cards under the form. Contact details are derived into links
>    from their lucide icon name (`Mail`→mailto, `Phone`→tel, `MapPin`→maps);
>    WhatsApp is derived from `VITE_WHATSAPP_NUMBER` or the published phone and
>    drops out entirely when neither resolves. Social links are filtered for real
>    URLs, so the row is hidden while `global.socialLinks` is all `#`.
> 3. **Workshop** — the `mapEmbedUrl` iframe beside the address, hours, photo and
>    directions. This band closes the page.
>
> The form posts `phone` and six enquiry types; both required backend changes (the
> `contact-submission` schema and the `SUBJECTS` allowlist in its controller), and
> the three lists must stay in sync — controller, seed `formSubjects`, and
> `SUBJECTS` in the route.
>
> The page reads four of `contact-page`'s fields and renders none of them:
> `faqEyebrow`, `faqHeading`, `faqs` and `cta`. A FAQ accordion and a closing CTA
> were both built and then cut on review. All four are left in the schema, so
> restoring either is a render, not a migration.

> **Superseded for About.** `src/routes/about.tsx` was rebuilt again after this log
> was written and no longer matches the Phase 1 description: the cinematic hero is
> now a light split hero, the values band and the teal closing CTA are gone, the
> materials band is alternating rows rather than a card grid, and there is a
> dedicated film band. The eyebrow rule (`tracking-[0.3em]` with flanking hairlines)
> was dropped there too. Read the file, not this line, for the current pattern.

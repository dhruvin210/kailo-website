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

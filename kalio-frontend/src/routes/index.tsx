import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  MapPin,
  Play,
  Quote,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { Lightbox } from "@/components/Lightbox";
import { VideoLoop } from "@/components/VideoLoop";
import { CmsLink } from "@/components/CmsLink";

import { homePageQuery, type HomePage } from "@/lib/queries";
import { mediaAlt, mediaSrcSet, mediaUrl, SIZES } from "@/lib/strapi";

// The films ship with the app rather than through Strapi — the CMS models images
// only, and these are fixed brand footage rather than editorial content. Posters
// are stills lifted from each clip's opening second.
import filmCollection from "@/assets/videos/the-collection.mp4";
import filmCollectionPoster from "@/assets/videos/posters/the-collection.jpg";
import filmAtelier from "@/assets/videos/atelier-golden-hour.mp4";
import filmAtelierPoster from "@/assets/videos/posters/atelier-golden-hour.jpg";
import filmCabin from "@/assets/videos/cabin-morning.mp4";
import filmCabinPoster from "@/assets/videos/posters/cabin-morning.jpg";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const home = await context.queryClient.ensureQueryData(homePageQuery());
    return { home };
  },
  head: ({ loaderData }) => {
    const seo = loaderData?.home.seo;
    const firstSlide = loaderData?.home.heroSlides?.[0];

    const title = seo?.metaTitle ?? "Kailo — Premium Instrument Accessories";
    const description =
      seo?.metaDescription ??
      "Crafted with finesse, made to move your soul. Handmade leather ukulele bags and hand-stitched straps for musicians who carry their music with pride.";
    // The hero's first frame is the fallback share image, as it was before the CMS.
    const ogImage = mediaUrl(seo?.ogImage) || mediaUrl(firstSlide?.image);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
        { property: "og:url", content: "/" },
      ],
      // The first hero frame is the LCP element; React preloads it from the
      // eager/high-priority <img> in <Hero />.
      links: [{ rel: "canonical", href: seo?.canonicalUrl ?? "/" }],
    };
  },
  component: Home,
});

/* ──────────────────────────── CONTENT ──────────────────────────── */

/**
 * CMS text with the pre-CMS copy as its fallback.
 *
 * Applied to the short, layout-bearing strings — eyebrows, headings, button labels
 * — where an empty field would leave a visible hole. Body paragraphs are rendered
 * as-is; a missing one simply collapses.
 */
const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

/** Avatar monogram, when the editor left `initials` blank. */
const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("");

/* ──────────────────────────── MOTION ──────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared scroll-reveal defaults for section content. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: EASE },
};

/** Staggered variant of `reveal` for items inside a grid. */
const revealItem = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
});

/* ──────────────────────────── PAGE ──────────────────────────── */

function Home() {
  const { home } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero home={home} />
      <KailoSpirit home={home} />
      <ShopByCategory home={home} />
      <InMotion />
      <OurGallery home={home} />
      <KindWords home={home} />
    </SiteLayout>
  );
}

/* ──────────────────────────── 1. HERO ──────────────────────────── */

function Hero({ home }: { home: HomePage }) {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Image drifts down while the copy lifts and fades as the hero scrolls away.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const heroSlides = useMemo(
    () =>
      (home.heroSlides ?? []).map((slide) => ({
        src: mediaUrl(slide.image),
        srcSet: mediaSrcSet(slide.image),
        alt: mediaAlt(slide.image, slide.alt),
        // Focal point keeps the subject in frame as the crop tightens.
        position: slide.position ?? "center center",
      })),
    [home.heroSlides],
  );

  const heroStats = home.heroStats ?? [];

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = heroSlides.length;

  const goTo = useCallback(
    (i: number) => {
      if (slideCount === 0) return;
      setSlide((i + slideCount) % slideCount);
    },
    [slideCount],
  );

  // Auto-advance, unless hovered or the visitor prefers reduced motion.
  useEffect(() => {
    if (paused || reduceMotion || slideCount < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), 6500);
    return () => clearInterval(id);
  }, [paused, reduceMotion, slideCount]);

  // Warm the remaining frames once the first one has had a head start. The
  // candidate list is set too, so this fetches the same file the <img> will ask
  // for rather than pulling the full-size original into cache unused.
  useEffect(() => {
    const id = window.setTimeout(() => {
      heroSlides.slice(1).forEach((s) => {
        const img = new Image();
        if (s.srcSet) {
          img.sizes = SIZES.fullWidth;
          img.srcset = s.srcSet;
        }
        img.src = s.src;
      });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [heroSlides]);

  return (
    <section
      ref={heroRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Kailo highlights"
      // Sits below the solid white navbar, filling the rest of the viewport.
      className="relative flex flex-col overflow-hidden bg-[oklch(0.16_0.02_265)] lg:block lg:h-[calc(100svh-4rem)] lg:min-h-[620px] lg:max-h-[920px]"
    >
      {/* ── Media ── */}
      <div className="relative aspect-4/3 w-full overflow-hidden sm:aspect-16/10 lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        {/* Oversized so the parallax drift never reveals an edge */}
        <motion.div
          style={reduceMotion ? undefined : { y: imageY }}
          className="absolute -top-[6%] h-[112%] w-full will-change-transform"
        >
          <motion.div
            className="flex h-full w-full cursor-grab active:cursor-grabbing"
            animate={{ x: `-${slide * 100}%` }}
            transition={{ duration: 0.9, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goTo(slide + 1);
              else if (info.offset.x > 80) goTo(slide - 1);
            }}
          >
            {heroSlides.map((s, i) => (
              <div
                key={`${s.src}-${i}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slideCount}`}
                className="h-full w-full shrink-0"
              >
                <img
                  src={s.src}
                  srcSet={s.srcSet}
                  sizes={SIZES.fullWidth}
                  alt={s.alt}
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                  style={{ objectPosition: s.position }}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Legibility grade — dark where the copy sits, plus a base fade into
            the dark copy panel on stacked (below-lg) layouts. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.02_265)] via-black/25 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/90 via-black/55 via-45% to-black/10 lg:block" />
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_65%_45%,transparent_35%,rgba(0,0,0,0.5)_100%)] lg:block" />

        {/* Fine film grain */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] mix-blend-overlay"
          aria-hidden="true"
        >
          <filter id="hero-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>
      </div>

      {/* ── Copy ── */}
      <motion.div
        style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
        className="relative z-10 w-full px-5 pb-16 pt-9 sm:px-8 lg:pointer-events-none lg:absolute lg:inset-0 lg:flex lg:items-center lg:p-0"
      >
        <div className="mx-auto w-full max-w-7xl lg:px-8">
          <div className="max-w-2xl text-white lg:pointer-events-auto lg:max-w-3xl xl:max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] backdrop-blur sm:text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {text(home.heroEyebrow, "Handcrafted in India")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="text-[2.5rem] font-semibold leading-[1.12] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {text(home.heroHeadingLine1, "Crafted with finesse,")}
              <br />
              <span className="italic text-primary">
                {text(home.heroHeadingLine2, "made to move your soul")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              {home.heroSubtext}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
              className="mt-9 flex flex-wrap gap-3 sm:gap-4"
            >
              <CmsLink
                href={home.heroPrimaryCtaHref}
                fallbackHref="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[oklch(0.16_0.02_265)] shadow-lg shadow-black/20 transition hover:bg-primary hover:text-primary-foreground sm:px-8 sm:py-4 sm:text-base"
              >
                {text(home.heroPrimaryCtaLabel, "Shop the Collection")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </CmsLink>

              <CmsLink
                href={home.heroSecondaryCtaHref}
                fallbackHref="#gallery"
                className="inline-flex items-center gap-2 rounded-full border border-white/50 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white hover:bg-white/15 sm:px-8 sm:py-4 sm:text-base"
              >
                {text(home.heroSecondaryCtaLabel, "Explore the Gallery")}
              </CmsLink>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
              className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6"
            >
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-xl font-semibold text-white">{stat.value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </div>
      </motion.div>

      {/* ── Slider controls ── */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5">
        {heroSlides.map((s, i) => (
          <button
            key={`${s.src}-${i}`}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === slide}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === slide ? "w-9 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-5 right-5 z-30 hidden gap-2 sm:flex">
        <button
          type="button"
          onClick={() => goTo(slide - 1)}
          aria-label="Previous slide"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(slide + 1)}
          aria-label="Next slide"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────── 2. THE KAILO SPIRIT ─────────────────────── */

function KailoSpirit({ home }: { home: HomePage }) {
  const spiritChips = home.storyChips ?? [];

  return (
    <section className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          // Capped below lg so the tall 4:5 frame never dominates a phone or tablet.
          className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-none"
        >
          <div className="overflow-hidden rounded-[2rem] shadow-2xl">
            <img
              src={mediaUrl(home.storyImage)}
              srcSet={mediaSrcSet(home.storyImage)}
              sizes={SIZES.editorialHalf}
              alt={mediaAlt(home.storyImage, "A handcrafted Kailo leather ukulele bag")}
              loading="lazy"
              decoding="async"
              className="aspect-4/5 w-full object-cover"
            />
          </div>

          {/* Overlapping workshop frame */}
          {home.storyInsetImage && (
            <img
              src={mediaUrl(home.storyInsetImage, "small")}
              srcSet={mediaSrcSet(home.storyInsetImage)}
              // Never wider than 13rem, even on desktop.
              sizes="13rem"
              alt={mediaAlt(
                home.storyInsetImage,
                "A Kailo artisan hand-stitching leather at the workbench",
              )}
              loading="lazy"
              decoding="async"
              className="absolute -bottom-8 -right-4 hidden aspect-square w-36 rounded-3xl object-cover shadow-2xl ring-4 ring-background sm:block sm:w-44 lg:-right-8 lg:w-52"
            />
          )}

          {/* Floating stat card */}
          <div className="absolute left-5 top-5 rounded-2xl border border-border bg-card/95 px-5 py-3.5 shadow-xl backdrop-blur">
            <p className="font-display text-2xl font-semibold text-primary">
              {text(home.storyStatValue, "100%")}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {text(home.storyStatLabel, "Hand-finished")}
            </p>
          </div>
        </motion.div>

        <motion.div {...reveal} className="order-1 lg:order-2">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {text(home.storyEyebrow, "The Kailo Spirit")}
          </p>
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
            {text(home.storyHeading, "A touch of island spirit for every artist")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{home.storyBody}</p>
          {home.storyBodySecondary && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {home.storyBodySecondary}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {spiritChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>

          <CmsLink
            href={home.storyCtaHref}
            fallbackHref="/about"
            className="group mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            {text(home.storyCtaLabel, "Read our story")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </CmsLink>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────── 3. SHOP BY CATEGORY ─────────────────────── */

function ShopByCategory({ home }: { home: HomePage }) {
  const categories = home.categoryTiles ?? [];

  return (
    <section className="bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          eyebrow={text(home.categoriesEyebrow, "Browse")}
          title={text(home.categoriesHeading, "Shop by Category")}
          action={{ to: "/products", label: "View all products" }}
        />

        {/* Bento on desktop — the feature tile takes two of three columns, the rest
            stack beside it — and a two-up grid on smaller screens. */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:h-[560px] lg:grid-cols-3 lg:grid-rows-2">
          {categories.map((category, i) => (
            <motion.div
              key={category.name}
              {...revealItem(i)}
              className={category.feature ? "col-span-2 lg:row-span-2 lg:h-full" : "lg:h-full"}
            >
              <CategoryTileLink category={category}>
                <img
                  src={mediaUrl(category.image)}
                  srcSet={mediaSrcSet(category.image)}
                  sizes={category.feature ? SIZES.categoryFeature : SIZES.categoryTile}
                  alt={mediaAlt(category.image, category.name)}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: category.position ?? "center center" }}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:h-full lg:aspect-auto ${
                    category.feature ? "aspect-16/10" : "aspect-square"
                  }`}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-45% to-transparent" />

                {category.comingSoon && (
                  <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground shadow-sm backdrop-blur sm:left-5 sm:top-5">
                    Coming soon
                  </span>
                )}

                <div className="pointer-events-none absolute inset-x-4 bottom-4 text-white sm:inset-x-5 sm:bottom-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/85 sm:text-xs">
                    {category.tagline}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <h3
                      className={`font-semibold ${
                        category.feature ? "text-2xl sm:text-3xl" : "text-lg sm:text-2xl"
                      }`}
                    >
                      {category.name}
                    </h3>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </CategoryTileLink>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TILE_CLASS =
  "group relative flex h-full overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow duration-500 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/**
 * A bento tile's link.
 *
 * The usual case is a deep link into the shop with the category pre-selected, which
 * goes through the typed `Link` so the search param stays validated. A tile pointed
 * somewhere else entirely falls back to the generic CMS link.
 */
function CategoryTileLink({
  category,
  children,
}: {
  category: NonNullable<HomePage["categoryTiles"]>[number];
  children: React.ReactNode;
}) {
  const href = category.href?.trim() || "/products";

  if (href === "/products") {
    return (
      <Link
        to="/products"
        search={category.categoryFilter ? { category: category.categoryFilter } : {}}
        className={TILE_CLASS}
      >
        {children}
      </Link>
    );
  }

  return (
    <CmsLink href={href} className={TILE_CLASS}>
      {children}
    </CmsLink>
  );
}

/* ─────────────────────── 4. IN MOTION ─────────────────────── */

/**
 * The three brand films, in layout order — the feature first, then the two that
 * stack beside it. Moving a clip between slots is a matter of reordering this.
 */
const FILMS = [
  {
    src: filmCollection,
    poster: filmCollectionPoster,
    title: "The Collection",
    meta: "Brass, grain, and the whole line-up",
    label:
      "A close pass across a Kailo bag's brass zip and buckle, then the full range of cases laid out along a workshop bench",
  },
  {
    src: filmAtelier,
    poster: filmAtelierPoster,
    title: "Golden Hour at the Bench",
    meta: "Where every bag is finished",
    label:
      "A ukulele beside a grey Kailo bag on a sunlit workbench, the padded lining opened out, then the bag with a denim strap",
  },
  {
    src: filmCabin,
    poster: filmCabinPoster,
    title: "Packed and Out the Door",
    meta: "The part before the playing",
    label:
      "A ukulele and a Kailo bag on a wooden bench in morning light, a close look at the stitched leather handle, then a case waiting by the door",
  },
];

/**
 * A dark, cinematic band of looping footage — the one break in the homepage's
 * run of still grids, and the only place the brand moves.
 *
 * The loops are silent wallpaper; the sound is the reward for tapping one, which
 * opens the film full-screen in the shared lightbox.
 */
function InMotion() {
  const [open, setOpen] = useState<number | null>(null);

  const total = FILMS.length;
  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(() => setOpen((o) => (o === null ? o : (o + 1) % total)), [total]);
  const prev = useCallback(
    () => setOpen((o) => (o === null ? o : (o - 1 + total) % total)),
    [total],
  );

  return (
    <section className="relative overflow-hidden bg-[var(--film-band)] py-20 text-[var(--ink)] sm:py-24 lg:py-28">
      {/* Light and shade washed into the flat teal, so the band has depth behind
          the tiles. White reads as haze here where a teal glow would go muddy. */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[var(--primary-dark)]/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--ink)]/75">
            <span className="h-px w-8 bg-[var(--ink)]/30" />
            In Motion
          </p>
          <h2 className="mt-5 text-4xl font-semibold md:text-5xl">Ten seconds with a Kailo</h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--ink)]/75">
            Short films from the bench and the road — the grain, the brass and the stitch line, in
            the light they were made for.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/20 bg-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)]/80 backdrop-blur">
            <Volume2 className="h-3.5 w-3.5" />
            Tap any film for sound
          </p>
        </motion.div>

        {/* Bento, as the category band above: the feature holds two of three columns
            and both rows, the other two films stack beside it. */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {FILMS.map((film, i) => (
            <motion.div
              key={film.title}
              {...revealItem(i)}
              className={i === 0 ? "lg:col-span-2 lg:row-span-2 lg:h-full" : "lg:h-full"}
            >
              <FilmTile film={film} feature={i === 0} onOpen={() => setOpen(i)} />
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open !== null && (
          <Lightbox
            kind="video"
            src={FILMS[open].src}
            poster={FILMS[open].poster}
            alt={FILMS[open].label}
            index={open}
            total={total}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function FilmTile({
  film,
  feature,
  onOpen,
}: {
  film: (typeof FILMS)[number];
  feature: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Watch “${film.title}” with sound`}
      // 21:9 is a deliberate letterbox: it suits a film strip, it keeps three
      // clips from becoming a tall wall on a phone, and the top-anchored crop
      // takes the generator's watermark out of the low-right corner with it.
      // The captions sit on footage, not on the band, so everything inside the
      // tile stays white even though the section around it is inked.
      className="group relative block aspect-21/9 w-full overflow-hidden rounded-3xl text-white ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--film-band)] lg:aspect-auto lg:h-full"
    >
      <VideoLoop
        src={film.src}
        poster={film.poster}
        label={film.label}
        style={{ objectPosition: "center top" }}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <span className="pointer-events-none absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-[var(--ink)] sm:right-5 sm:top-5">
        <Play className="h-4 w-4 fill-current" />
      </span>

      <span className="pointer-events-none absolute inset-x-4 bottom-3.5 text-left sm:inset-x-5 sm:bottom-5">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/75 sm:text-xs">
          {film.meta}
        </span>
        <span
          className={`mt-1 block font-semibold ${feature ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}
        >
          {film.title}
        </span>
      </span>
    </button>
  );
}

/* ─────────────────────── 5. OUR GALLERY ─────────────────────── */

function OurGallery({ home }: { home: HomePage }) {
  const [open, setOpen] = useState<number | null>(null);

  const galleryTiles = useMemo(
    () =>
      (home.homeGallery ?? []).map((tile) => ({
        src: mediaUrl(tile.image),
        srcSet: mediaSrcSet(tile.image),
        alt: mediaAlt(tile.image, tile.alt),
        tall: tile.tall,
      })),
    [home.homeGallery],
  );

  const total = galleryTiles.length;

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(() => setOpen((o) => (o === null ? o : (o + 1) % total)), [total]);
  const prev = useCallback(
    () => setOpen((o) => (o === null ? o : (o - 1 + total) % total)),
    [total],
  );

  return (
    <section id="gallery" className="scroll-mt-16 bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* The full-gallery link lives under the grid, so no header action here. */}
        <SectionHead
          eyebrow={text(home.galleryEyebrow, "Moments")}
          title={text(home.galleryHeading, "Our Gallery")}
          description={home.galleryDescription ?? undefined}
        />

        {/* Asymmetric grid — two tall frames anchor the row on desktop. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:h-[640px] lg:grid-cols-4 lg:grid-rows-2">
          {galleryTiles.map((tile, i) => (
            <motion.button
              key={`${tile.src}-${i}`}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open image ${i + 1} of ${total}`}
              {...revealItem(i % 4)}
              className={`group relative overflow-hidden rounded-2xl bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:rounded-3xl ${
                tile.tall ? "lg:row-span-2" : ""
              }`}
            >
              <img
                src={tile.src}
                srcSet={tile.srcSet}
                sizes={SIZES.galleryTile}
                alt={tile.alt}
                loading="lazy"
                decoding="async"
                className="aspect-3/4 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:aspect-auto"
              />

              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground opacity-0 backdrop-blur transition-all duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="h-4 w-4" />
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div {...reveal} className="mt-12 flex justify-center">
          <Link
            to="/gallery"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View the full gallery
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {open !== null && galleryTiles[open] && (
          <Lightbox
            src={galleryTiles[open].src}
            alt={galleryTiles[open].alt}
            index={open}
            total={total}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─────────────────────── 6. KIND WORDS ─────────────────────── */

function KindWords({ home }: { home: HomePage }) {
  const testimonials = home.testimonials ?? [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToCard = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, testimonials.length - 1));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0] as HTMLElement | undefined;
    const second = track.children[1] as HTMLElement | undefined;
    const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
    if (step <= 0) return;
    setActive(Math.round(track.scrollLeft / step));
  };

  return (
    // Soft ground, so this alternates against the gallery section above it.
    <section className="bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...reveal} className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {text(home.testimonialsEyebrow, "Testimonials")}
          </p>
          <h2 className="text-4xl font-semibold md:text-5xl">
            {text(home.testimonialsHeading, "Kind Words")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {home.testimonialsDescription}
          </p>
        </motion.div>

        <motion.div {...reveal}>
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
          >
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex shrink-0 basis-[86%] snap-start flex-col rounded-3xl border border-border bg-card p-7 transition-shadow duration-500 hover:shadow-xl sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-14px)]"
              >
                <Quote className="h-8 w-8 text-primary/30" />

                <div className="mt-4 flex gap-0.5" aria-label={`Rated ${t.rating} out of 5`}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-4 border-t border-border pt-5">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[var(--primary-dark)] font-display text-sm font-semibold text-primary-foreground"
                  >
                    {t.initials?.trim() || initialsFor(t.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                    {t.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary" />
                        {t.location}
                      </p>
                    )}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Carousel controls */}
          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => scrollToCard(active - 1)}
              aria-label="Previous testimonials"
              className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => scrollToCard(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={i === active}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-7 bg-primary" : "w-2 bg-border hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollToCard(active + 1)}
              aria-label="Next testimonials"
              className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────── SHARED ─────────────────────── */

function SectionHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { to: string; label: string };
}) {
  return (
    <motion.div
      {...reveal}
      className="mb-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-4"
    >
      <div className="max-w-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-4xl font-semibold md:text-5xl">{title}</h2>
        {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
      </div>

      {action && (
        <Link
          to={action.to}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  );
}

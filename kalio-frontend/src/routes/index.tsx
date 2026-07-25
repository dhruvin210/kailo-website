import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  MapPin,
  Quote,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/SiteLayout";
import { Lightbox } from "@/components/Lightbox";

import { useCart } from "@/lib/cart";
import { PRODUCTS, formatINR, type Product } from "@/lib/products";

import hero1 from "@/assets/gallery/hero1.png";
import hero2 from "@/assets/gallery/hero2.png";
import hero3 from "@/assets/gallery/hero3.png";
import hero4 from "@/assets/gallery/hero4.png";

import storyImage from "@/assets/gallery/photo07.jpeg";
import artisanImage from "@/assets/lifestyle/artisan.png";

import categoryCases from "@/assets/products/ukulele-case.png";
import categoryStraps from "@/assets/products/leather-strap.png";
import categoryTuners from "@/assets/products/clip-tuner.png";
import categoryPicks from "@/assets/products/pick-set.png";
import categoryCare from "@/assets/products/cleaning-kit.png";

import gallery1 from "@/assets/gallery/gallery1.jpeg";
import gallery2 from "@/assets/gallery/photo21.jpeg";
import gallery3 from "@/assets/gallery/gallery3.jpeg";
import gallery4 from "@/assets/gallery/gallery4.jpeg";
import gallery5 from "@/assets/gallery/gallery5.jpeg";
import gallery6 from "@/assets/gallery/gallery6.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kailo — Premium Instrument Accessories" },
      {
        name: "description",
        content:
          "Crafted with finesse, made to move your soul. Handmade leather ukulele bags, straps, tuners and care kits for musicians who carry their music with pride.",
      },
      { property: "og:title", content: "Kailo — Premium Instrument Accessories" },
      {
        property: "og:description",
        content: "Crafted with finesse, made to move your soul.",
      },
      { property: "og:image", content: hero1 },
      { property: "og:url", content: "/" },
    ],
    // The first hero frame is the LCP element; React preloads it from the
    // eager/high-priority <img> in <Hero />.
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

/* ──────────────────────────── CONTENT ──────────────────────────── */

const heroSlides = [
  {
    image: hero1,
    // Focal point keeps the musicians in frame as the crop tightens.
    position: "50% 58%",
    alt: "Three friends in a Goa garden with handcrafted Kailo instrument bags",
  },
  {
    image: hero2,
    position: "55% 50%",
    alt: "A woman by the river leaning on a tree with a red leather Kailo ukulele bag",
  },
  {
    image: hero3,
    position: "50% 52%",
    alt: "A musician in a bamboo grove carrying a brown leather Kailo instrument bag",
  },
  {
    image: hero4,
    position: "50% 58%",
    alt: "A musician on garden steps with a black Kailo ukulele bag",
  },
];

const heroStats = [
  { value: "4.9", label: "Average rating" },
  { value: "2,400+", label: "Musicians served" },
  { value: "40+", label: "Countries shipped" },
];

const spiritChips = ["Full-grain leather", "Hand-stitched", "Ships worldwide"];

const categories = [
  {
    name: "Cases",
    category: "Cases",
    tagline: "Protect every note",
    image: categoryCases,
    position: "60% center",
    feature: true,
  },
  {
    name: "Straps",
    category: "Straps",
    tagline: "Carry with pride",
    image: categoryStraps,
    position: "center center",
    feature: false,
  },
  {
    name: "Tuners",
    category: "Tuners",
    tagline: "Always in key",
    image: categoryTuners,
    position: "center center",
    feature: false,
  },
  {
    name: "Picks",
    category: "Picks",
    tagline: "The finishing touch",
    image: categoryPicks,
    position: "center center",
    feature: false,
  },
  {
    name: "Care Kits",
    category: "Cleaning Kits",
    tagline: "Keep it singing",
    image: categoryCare,
    position: "center center",
    feature: false,
  },
];

const galleryTiles = [
  { src: gallery1, alt: "A Kailo ukulele bag on the road", tall: true },
  { src: gallery2, alt: "A musician tuning up before a set", tall: false },
  { src: gallery3, alt: "Behind the scenes at a Kailo workshop", tall: false },
  { src: gallery4, alt: "A performance lit by evening light", tall: true },
  { src: gallery5, alt: "Hand-stitched leather detailing", tall: false },
  { src: gallery6, alt: "Friends playing together outdoors", tall: false },
];

/** The four most-reviewed products stand in for our best sellers. */
const bestSellers: Product[] = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 4);

const testimonials = [
  {
    initials: "AM",
    name: "Aria Mendes",
    role: "Session guitarist",
    location: "Lisbon, Portugal",
    rating: 5,
    quote:
      "The leather strap broke in beautifully within a week. It feels like it was made for my shoulder.",
  },
  {
    initials: "DK",
    name: "Devon Kaur",
    role: "Touring ukulele player",
    location: "Melbourne, Australia",
    rating: 5,
    quote:
      "My ukulele case survived three flights without a scratch. Kailo just gets touring life.",
  },
  {
    initials: "PS",
    name: "Priya Suresh",
    role: "Studio producer",
    location: "Chennai, India",
    rating: 5,
    quote: "Gorgeous materials and thoughtful details. It is rare to find gear this considered.",
  },
  {
    initials: "MF",
    name: "Milo Ferreira",
    role: "Violinist, chamber quartet",
    location: "São Paulo, Brazil",
    rating: 5,
    quote: "Twelve cities in five weeks and the carbon shell still closes like the day it arrived.",
  },
  {
    initials: "HI",
    name: "Hana Ito",
    role: "Singer-songwriter",
    location: "Kyoto, Japan",
    rating: 5,
    quote: "Every detail feels intentional — the stitching, the lining, even the way it smells.",
  },
  {
    initials: "NB",
    name: "Noah Bergman",
    role: "Bassist",
    location: "Berlin, Germany",
    rating: 5,
    quote: "Three sets a night and my shoulder no longer complains. That alone was worth it.",
  },
];

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
  return (
    <SiteLayout>
      <Hero />
      <KailoSpirit />
      <ShopByCategory />
      <OurGallery />
      <BestSellers />
      <KindWords />
    </SiteLayout>
  );
}

/* ──────────────────────────── 1. HERO ──────────────────────────── */

function Hero() {
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

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = heroSlides.length;

  const goTo = useCallback((i: number) => setSlide((i + slideCount) % slideCount), [slideCount]);

  // Auto-advance, unless hovered or the visitor prefers reduced motion.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), 6500);
    return () => clearInterval(id);
  }, [paused, reduceMotion, slideCount]);

  // Warm the remaining frames once the first one has had a head start.
  useEffect(() => {
    const id = window.setTimeout(() => {
      heroSlides.slice(1).forEach((s) => {
        const img = new Image();
        img.src = s.image;
      });
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

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
                key={s.alt}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slideCount}`}
                className="h-full w-full shrink-0"
              >
                <img
                  src={s.image}
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
              Handcrafted in India
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="text-[2.5rem] font-semibold leading-[1.12] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Crafted with finesse,
              <br />
              <span className="italic text-primary">made to move your soul</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              Premium leather ukulele bags and hand-stitched leather &amp; denim straps for artists
              who carry their music with pride.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
              className="mt-9 flex flex-wrap gap-3 sm:gap-4"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[oklch(0.16_0.02_265)] shadow-lg shadow-black/20 transition hover:bg-primary hover:text-primary-foreground sm:px-8 sm:py-4 sm:text-base"
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-full border border-white/50 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white hover:bg-white/15 sm:px-8 sm:py-4 sm:text-base"
              >
                Explore the Gallery
              </a>
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
            key={s.alt}
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

function KailoSpirit() {
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
              src={storyImage}
              alt="A handcrafted Kailo leather ukulele bag"
              loading="lazy"
              decoding="async"
              className="aspect-4/5 w-full object-cover"
            />
          </div>

          {/* Overlapping workshop frame */}
          <img
            src={artisanImage}
            alt="A Kailo artisan hand-stitching leather at the workbench"
            loading="lazy"
            decoding="async"
            className="absolute -bottom-8 -right-4 hidden aspect-square w-36 rounded-3xl object-cover shadow-2xl ring-4 ring-background sm:block sm:w-44 lg:-right-8 lg:w-52"
          />

          {/* Floating stat card */}
          <div className="absolute left-5 top-5 rounded-2xl border border-border bg-card/95 px-5 py-3.5 shadow-xl backdrop-blur">
            <p className="font-display text-2xl font-semibold text-primary">100%</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Hand-finished
            </p>
          </div>
        </motion.div>

        <motion.div {...reveal} className="order-1 lg:order-2">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            The Kailo Spirit
          </p>
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
            A touch of island spirit for every artist
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            At Kailo, we create premium leather ukulele bags and handcrafted leather &amp; denim
            straps designed for artists who carry their music with pride. Thoughtful textures, rich
            materials, and a touch of island spirit come together to elevate not just your
            instrument — but your entire journey with it.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Every piece is cut, stitched and finished by hand in small batches, by makers who play
            as much as they craft.
          </p>

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

          <Link
            to="/about"
            className="group mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Read our story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────── 3. SHOP BY CATEGORY ─────────────────────── */

function ShopByCategory() {
  return (
    <section className="bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          eyebrow="Browse"
          title="Shop by Category"
          action={{ to: "/products", label: "View all products" }}
        />

        {/* Bento on desktop, two-up grid on smaller screens. */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:h-[560px] lg:grid-cols-4 lg:grid-rows-2">
          {categories.map((category, i) => (
            <motion.div
              key={category.name}
              {...revealItem(i)}
              className={category.feature ? "col-span-2 lg:row-span-2 lg:h-full" : "lg:h-full"}
            >
              <Link
                to="/products"
                search={{ category: category.category }}
                className="group relative flex h-full overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow duration-500 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: category.position }}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:h-full lg:aspect-auto ${
                    category.feature ? "aspect-16/10" : "aspect-square"
                  }`}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-45% to-transparent" />

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
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 4. OUR GALLERY ─────────────────────── */

function OurGallery() {
  const [open, setOpen] = useState<number | null>(null);
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
          eyebrow="Moments"
          title="Our Gallery"
          description="Products, musicians, workshops, events and the moments in between."
        />

        {/* Asymmetric grid — two tall frames anchor the row on desktop. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:h-[640px] lg:grid-cols-4 lg:grid-rows-2">
          {galleryTiles.map((tile, i) => (
            <motion.button
              key={tile.src}
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
        {open !== null && (
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

/* ─────────────────────── 5. OUR BEST SELLERS ─────────────────────── */

function BestSellers() {
  return (
    <section className="bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          eyebrow="Loved by artists"
          title="Our Best Sellers"
          description="The pieces musicians keep coming back for."
          action={{ to: "/products", label: "Shop all" }}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {bestSellers.map((product, i) => (
            <motion.div key={product.id} {...revealItem(i)} className="h-full">
              <BestSellerCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestSellerCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      <Link
        to="/products/$id"
        params={{ id: product.id }}
        className="relative block overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="aspect-4/3 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
          Bestseller
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="font-semibold text-foreground">{product.rating}</span>
          <span>({product.reviews} reviews)</span>
        </div>

        <h3 className="mt-2 text-lg font-semibold leading-snug">
          <Link
            to="/products/$id"
            params={{ id: product.id }}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        {/* Pushed down so prices and CTAs line up across cards of any title length. */}
        <p className="mt-auto pt-4 font-display text-xl font-semibold text-foreground">
          {formatINR(product.price)}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Link
            to="/products/$id"
            params={{ id: product.id }}
            className="group/cta inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-dark)]"
          >
            View Product
            <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
          </Link>

          <button
            type="button"
            onClick={() => {
              add(product.id);
              toast.success(`${product.name} added to cart`, {
                closeButton: true,
              });
            }}
            aria-label={`Add ${product.name} to cart`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────── 6. KIND WORDS ─────────────────────── */

function KindWords() {
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
    <section className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...reveal} className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Testimonials
          </p>
          <h2 className="text-4xl font-semibold md:text-5xl">Kind Words</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Trusted on stages worldwide.
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
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      {t.location}
                    </p>
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

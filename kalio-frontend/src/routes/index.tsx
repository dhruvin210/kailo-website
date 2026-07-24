import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music,
  Truck,
  Star,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import GalleryGrid from "@/components/GalleryGrid";

import { PRODUCTS } from "@/lib/products";

import gallery1 from "@/assets/gallery/gallery1.jpeg";
import gallery2 from "@/assets/gallery/photo21.jpeg";
import gallery3 from "@/assets/gallery/gallery3.jpeg";
import gallery4 from "@/assets/gallery/gallery4.jpeg";
import gallery5 from "@/assets/gallery/gallery5.jpeg";
import gallery6 from "@/assets/gallery/gallery6.jpeg";

import storyImage from "@/assets/gallery/photo07.jpeg";

import hero1 from "@/assets/gallery/hero1.png";
import hero2 from "@/assets/gallery/hero2.png";
import hero3 from "@/assets/gallery/hero3.png";
import hero4 from "@/assets/gallery/hero4.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Kailo — Premium Instrument Accessories",
      },
      {
        name: "description",
        content:
          "Crafted with finesse, made to move your soul. Premium cases, straps, tuners and care kits for musicians.",
      },
    ],
  }),
  component: Home,
});

const heroSlides = [
  {
    image: hero1,
    position: "center center",
    alt: "Three friends in a Goa garden with handcrafted Kailo instrument bags",
  },
  {
    image: hero2,
    position: "center center",
    alt: "A woman by the river leaning on a tree with a red leather Kailo ukulele bag",
  },
  {
    image: hero3,
    position: "center center",
    alt: "A musician in a bamboo grove carrying a brown leather Kailo instrument bag",
  },
  {
    image: hero4,
    position: "center 40%",
    alt: "A musician on garden steps with a black Kailo ukulele bag",
  },
];

const bestSellers = PRODUCTS.slice(0, 4);

const categories = [
  {
    name: "Cases",
    tagline: "Protect every note",
    image:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Straps",
    tagline: "Carry with pride",
    image:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Tuners",
    tagline: "Always in key",
    image:
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Picks & Care",
    tagline: "The finishing touch",
    image:
      "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?auto=format&fit=crop&w=800&q=80",
  },
];

const galleryImages = [
  gallery1,
  gallery2,
  gallery3,
  gallery4,
  gallery5,
  gallery6,
];

const features = [
  {
    Icon: Sparkles,
    title: "Premium Craftsmanship",
    body: "Handpicked, full-grain materials worked by hand for durability and quiet elegance.",
  },
  {
    Icon: Music,
    title: "Made for Musicians",
    body: "Designed alongside working artists who live out of a case and on a strap.",
  },
  {
    Icon: Truck,
    title: "Worldwide Delivery",
    body: "Carefully packed and shipped globally in 3–5 business days, tracked door to door.",
  },
];

const testimonials = [
  {
    quote:
      "The leather strap broke in beautifully within a week. It feels like it was made for my shoulder.",
    name: "Aria M.",
    role: "Session guitarist",
  },
  {
    quote:
      "My ukulele case survived three flights without a scratch. Kailo just gets touring life.",
    name: "Devon K.",
    role: "Touring musician",
  },
  {
    quote:
      "Gorgeous materials and thoughtful details. It's rare to find gear this considered.",
    name: "Priya S.",
    role: "Studio producer",
  },
];

/** Shared scroll-reveal defaults for section content. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Image drifts down and text lifts + fades as the hero scrolls away.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // Hero slider — auto-advances, pausable on hover, swipeable, dot/arrow nav.
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = heroSlides.length;

  const goTo = useCallback(
    (i: number) => setSlide((i + slideCount) % slideCount),
    [slideCount]
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), 6000);
    return () => clearInterval(id);
  }, [paused, slideCount]);

  return (
    <SiteLayout>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section
        ref={heroRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative -mt-16 flex h-screen min-h-[640px] items-center overflow-hidden bg-black"
      >
        {/* Parallax slider — oversized so the drift never reveals an edge */}
        <motion.div
          style={{ y: imageY }}
          className="absolute inset-0 h-full w-full will-change-transform"
        >
          <motion.div
            className="flex h-full w-full cursor-grab active:cursor-grabbing"
            animate={{ x: `-${slide * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goTo(slide + 1);
              else if (info.offset.x > 80) goTo(slide - 1);
            }}
          >
            {heroSlides.map((s, i) => (
              <div key={i} className="h-full w-full shrink-0 overflow-hidden">
                <img
                  src={s.image}
                  alt={s.alt}
                  draggable={false}
                  style={{ objectPosition: s.position }}
                  className="h-full w-full origin-center object-contain"
                />
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Cinematic grade — dark on the left where text sits, plus a grounding
            bottom fade, so white text stays legible over the bright daylight photo. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

        {/* Cinematic vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

        {/* Fine film grain */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
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

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 mx-auto w-full max-w-400 px-4 lg:px-6"
        >
          <div className="max-w-3xl text-white">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Premium Instrument Accessories
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="text-4xl font-semibold leading-[1.08] md:text-6xl"
            >
              Crafted with finesse,
              <br />
              <span className="italic text-primary">
                made to move your soul
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/90"
            >
              Premium leather ukulele bags and handcrafted leather &amp; denim
              straps for artists who carry their music with pride.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-black transition hover:bg-[oklch(0.9_0.06_80)]"
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black"
              >
                Explore Gallery
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Slider dots */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === slide
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Slider arrows */}
        <div className="absolute bottom-6 right-6 z-20 hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => goTo(slide - 1)}
            aria-label="Previous slide"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(slide + 1)}
            aria-label="Next slide"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ─────────────────────── CATEGORIES ────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            {...reveal}
            className="mb-12 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Browse
              </p>
              <h2 className="text-4xl font-semibold md:text-5xl">
                Shop by Category
              </h2>
            </div>

            <Link
              to="/products"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              View all products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, i) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to="/products"
                  className="group relative block overflow-hidden rounded-3xl"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                      {category.tagline}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <h3 className="text-2xl font-semibold">
                        {category.name}
                      </h3>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-primary">
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

      {/* ─────────────────────── BRAND STORY ───────────────────── */}
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <img
                src={storyImage}
                alt="Handcrafted Kailo accessory"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -right-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-xl sm:-right-6">
              <p className="font-display text-3xl font-semibold text-primary">
                100%
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Hand-finished
              </p>
            </div>
          </motion.div>

          <motion.div {...reveal}>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              The Kailo Spirit
            </p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              A touch of island spirit for every artist
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              At Kailo, we create premium leather ukulele bags and handcrafted
              leather &amp; denim straps designed for artists who carry their
              music with pride. Thoughtful textures, rich materials, and a touch
              of island spirit come together to elevate not just your instrument
              — but your entire journey with it.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Full-grain leather", "Hand-stitched", "Ships worldwide"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {chip}
                  </span>
                )
              )}
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

      {/* ─────────────────────── WHY KAILO ─────────────────────── */}
      <section className="bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-14 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Why Kailo
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Built by musicians, for musicians
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-4xl font-semibold text-border">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── BEST SELLERS ──────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            {...reveal}
            className="mb-12 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Loved by artists
              </p>
              <h2 className="text-4xl font-semibold md:text-5xl">
                Our Best Sellers
              </h2>
            </div>

            <Link
              to="/products"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Shop all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── TESTIMONIALS ──────────────────── */}
      <section className="bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Kind words
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Trusted on stages worldwide
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col rounded-3xl border border-border bg-card p-8"
              >
                <Quote className="h-8 w-8 text-primary/30" />
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── GALLERY ───────────────────────── */}
      <section id="gallery" className="bg-background">
        <GalleryGrid images={galleryImages} />
      </section>

      {/* ─────────────────────── NEWSLETTER CTA ────────────────── */}
      <section className="px-6 pb-24 lg:px-8">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-[var(--primary-dark)] px-8 py-16 text-center text-white shadow-2xl md:px-16 md:py-20"
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold md:text-4xl">
              Join the Kailo circle
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Be first to hear about new drops, restocks, and stories from the
              workshop. No noise — just the good stuff.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                toast.success("You're on the list! Welcome to Kailo.", {
                  closeButton: true,
                });
                form.reset();
              }}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-full border border-white/30 bg-white/15 px-5 py-3.5 text-white placeholder:text-white/60 outline-none backdrop-blur transition focus:border-white focus:bg-white/25"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-white px-7 py-3.5 font-semibold text-primary transition hover:bg-white/90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Sparkles, Globe, ArrowRight } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";

import heroImage from "@/assets/gallery/photo03.jpeg";
import storyImage from "@/assets/gallery/photo12.jpeg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kailo" },
      {
        name: "description",
        content:
          "Kailo was founded by musicians, for musicians. Learn our story, mission and the team behind every accessory.",
      },
      { property: "og:title", content: "About Kailo" },
      { property: "og:description", content: "Founded by musicians, for musicians." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const values = [
  {
    Icon: Heart,
    title: "Made with care",
    body: "Every product is hand-checked before it ships — no exceptions, no shortcuts.",
  },
  {
    Icon: Sparkles,
    title: "Materials matter",
    body: "Full-grain leather, real brass, and recycled fabrics chosen to age beautifully.",
  },
  {
    Icon: Globe,
    title: "For the long haul",
    body: "Repair-friendly designs built to travel the world and outlast the trends.",
  },
];

const team = [
  { n: "Aria Chen", r: "Founder & CEO" },
  { n: "Marcus Reid", r: "Head of Design" },
  { n: "Jules Park", r: "Master Leatherworker" },
  { n: "Sam Okafor", r: "Engineering Lead" },
];

const milestones = [
  { y: "2020", t: "Founded in a Nashville garage" },
  { y: "2021", t: "First leather strap collection" },
  { y: "2022", t: "International shipping launches" },
  { y: "2023", t: "100,000 musicians served" },
];

function About() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Image drifts down and text lifts + fades as the hero scrolls away.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <SiteLayout>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section
        ref={heroRef}
        className="relative -mt-16 flex h-[80vh] min-h-[560px] items-center overflow-hidden bg-black"
      >
        {/* Parallax image — oversized so the drift never reveals an edge */}
        <motion.div
          style={{ y: imageY }}
          className="absolute -top-[9%] left-0 h-[118%] w-full will-change-transform"
        >
          <img
            src={heroImage}
            alt="A Kailo artisan finishing a handcrafted leather instrument bag"
            className="h-full w-full origin-center animate-slow-zoom object-cover"
            style={{ objectPosition: "center 35%" }}
          />
        </motion.div>

        {/* Cinematic grade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

        {/* Cinematic vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

        {/* Fine film grain */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
          aria-hidden="true"
        >
          <filter id="about-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#about-grain)" />
        </svg>

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8"
        >
          <div className="max-w-3xl text-white">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-primary"
            >
              Our Story
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="text-5xl font-semibold leading-[1.12] md:text-7xl"
            >
              Built for the moments
              <br />
              <span className="italic text-primary">that matter</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/90"
            >
              A workshop obsessed with the small things — so you can stay in the
              music.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────── BRAND STORY ───────────────────── */}
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div {...reveal}>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              How it started
            </p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              Founded by musicians, for musicians
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Kailo started in a Nashville garage in 2020 with a simple belief:
              every accessory should be as thoughtful as the instrument it
              serves. We obsess over the small things — the stitching on a
              strap, the lining of a case, the click of a capo — so you can stay
              in the music.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Today our gear travels with touring artists, bedroom songwriters
              and conservatory students in over forty countries. Same obsession,
              same workshop.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Nashville, est. 2020", "40+ countries", "Repair-friendly"].map(
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
          </motion.div>

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
                alt="Inside the Kailo workshop"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-xl sm:-left-6">
              <p className="font-display text-3xl font-semibold text-primary">
                100k+
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Musicians served
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── MISSION & VALUES ──────────────── */}
      <section className="bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-14 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              What we stand for
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Mission &amp; values
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map(({ Icon, title, body }, i) => (
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

      {/* ─────────────────────── MEET THE TEAM ─────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              The people
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Meet the team
            </h2>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <motion.div
                key={m.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group rounded-3xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto grid aspect-square w-full max-w-[180px] place-items-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 transition-transform duration-500 group-hover:scale-105">
                  <span className="font-display text-4xl font-semibold text-primary">
                    {m.n
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold">{m.n}</h3>
                <p className="text-sm text-muted-foreground">{m.r}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── MILESTONES ────────────────────── */}
      <section className="bg-[var(--bg-soft)] py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              The journey
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">Milestones</h2>
          </motion.div>

          <ol className="relative space-y-10 border-l-2 border-primary/30 pl-8">
            {milestones.map((m, i) => (
              <motion.li
                key={m.y}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
              >
                <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full bg-primary ring-4 ring-[var(--bg-soft)]" />
                <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
                  {m.y}
                </p>
                <p className="mt-1 text-lg font-medium">{m.t}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────── CTA ───────────────────────────── */}
      <section className="px-6 py-24 lg:px-8">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-[var(--primary-dark)] px-8 py-16 text-center text-white shadow-2xl md:px-16 md:py-20"
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold md:text-4xl">
              Carry your music with pride
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Explore accessories built by musicians who live out of a case and
              on a strap — made to move with you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-primary transition hover:bg-white/90"
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-primary"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </SiteLayout>
  );
}

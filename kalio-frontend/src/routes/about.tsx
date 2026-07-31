import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { CmsLink } from "@/components/CmsLink";
import { VideoLoop } from "@/components/VideoLoop";

import { getIcon } from "@/lib/icons";
import { aboutPageQuery, type AboutPage } from "@/lib/queries";
import { mediaAlt, mediaSrcSet, mediaUrl, SIZES } from "@/lib/strapi";

// Bundled with the app rather than CMS-managed — the CMS models images only, and
// this is fixed brand footage. The poster is a still from the clip's own opening.
import filmDetail from "@/assets/videos/brass-and-stitching.mp4";
import filmDetailPoster from "@/assets/videos/posters/brass-and-stitching.jpg";

export const Route = createFileRoute("/about")({
  loader: async ({ context }) => ({
    about: await context.queryClient.ensureQueryData(aboutPageQuery()),
  }),
  head: ({ loaderData }) => {
    const seo = loaderData?.about.seo;

    const title = seo?.metaTitle ?? "About — Kailo";
    const description =
      seo?.metaDescription ??
      "Kailo was founded by musicians, for musicians. Learn how a love of the ukulele became a workshop making leather bags worth carrying.";
    const ogImage = mediaUrl(seo?.ogImage) || mediaUrl(loaderData?.about.heroImage);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
        { property: "og:url", content: "/about" },
      ],
      links: [{ rel: "canonical", href: seo?.canonicalUrl ?? "/about" }],
    };
  },
  component: About,
});

/* ──────────────────────────── CONTENT ──────────────────────────── */

/**
 * CMS text with the pre-CMS copy as its fallback.
 *
 * Applied to the short, layout-bearing strings — eyebrows, headings, button
 * labels — where an empty field would leave a visible hole. Body paragraphs are
 * rendered as-is, and a band whose repeatable component is empty is skipped
 * entirely rather than rendered as a heading over nothing.
 */
const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

/**
 * The brand story, used when the CMS comes back empty — verbatim, as supplied.
 *
 * The one exception to the rule above: an empty story would leave the whole
 * editorial column blank beside a full-height image, so it falls back rather
 * than collapsing. `STORY_PULL_QUOTE` is an exact substring of `STORY_LEAD`.
 */
const STORY_LEAD =
  "Kailo began with a simple idea and a deep love for music. Founded by an amateur ukulele player, Kailo was born from the belief that every musician deserves to carry their instrument with pride, style, and confidence. A ukulele is more than just an instrument—it's a companion, a passion, and a part of who you are. We believed its case should reflect that.";

const STORY_PARAGRAPHS = [
  "Leather has always been a timeless symbol of craftsmanship and style. By combining premium leather with thoughtful design, we set out to create instrument bags that not only protect your ukulele but also make a statement wherever your music takes you.",
  "Every Kailo bag is crafted with meticulous attention to detail—from the precision of every stitch to the comfort of every strap and the softness of every lining. Because we know it's the little things that make a big difference.",
  "Today, Kailo accompanies touring artists, passionate hobbyists, bedroom songwriters, and music students throughout the country, expanding its footprint to the entire world. While our community has grown, our purpose remains unchanged: to create beautifully crafted bags that protect the instruments musicians love and inspire them to carry their music with confidence.",
];

const STORY_PULL_QUOTE =
  "A ukulele is more than just an instrument—it's a companion, a passion, and a part of who you are.";

/** Two digits, so "01 / 02" line up under a display face. */
const ordinal = (i: number) => String(i + 1).padStart(2, "0");

/* ──────────────────────────── MOTION ──────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The page's scroll-reveal props, flattened to a plain fade for a visitor who
 * asked for less motion.
 *
 * The stylesheet's `prefers-reduced-motion` block only reaches CSS animations
 * and transitions — framer-motion writes inline transforms, so the offsets have
 * to be dropped here instead.
 */
function useReveal() {
  const reduceMotion = useReducedMotion() ?? false;

  return useMemo(() => {
    const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 };
    const shown = { opacity: 1, y: 0 };

    return {
      reduceMotion,
      reveal: {
        initial: hidden,
        whileInView: shown,
        viewport: { once: true, margin: "-80px" } as const,
        transition: { duration: reduceMotion ? 0.3 : 0.6, ease: EASE },
      },
      revealItem: (i: number) => ({
        initial: hidden,
        whileInView: shown,
        viewport: { once: true, margin: "-60px" } as const,
        transition: {
          duration: reduceMotion ? 0.3 : 0.55,
          delay: reduceMotion ? 0 : i * 0.08,
          ease: EASE,
        },
      }),
    };
  }, [reduceMotion]);
}

/* ──────────────────────────── PAGE ──────────────────────────── */

function About() {
  const { about } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero about={about} />
      <Story about={about} />
      <Materials about={about} />
      <Craft about={about} />
      <Values about={about} />
      <Audience about={about} />
      <ClosingCta cta={about.cta} />
    </SiteLayout>
  );
}

/* ─────────────────────────── 1. HERO ─────────────────────────── */

function Hero({ about }: { about: AboutPage }) {
  const reduceMotion = useReducedMotion();
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
    <section
      ref={heroRef}
      className="relative -mt-16 flex h-[86vh] min-h-[600px] items-center overflow-hidden bg-black"
    >
      {/* Parallax image — oversized so the drift never reveals an edge */}
      <motion.div
        style={reduceMotion ? undefined : { y: imageY }}
        className="absolute -top-[9%] left-0 h-[118%] w-full will-change-transform"
      >
        <img
          src={mediaUrl(about.heroImage)}
          srcSet={mediaSrcSet(about.heroImage)}
          sizes={SIZES.fullWidth}
          alt={mediaAlt(
            about.heroImage,
            "A Kailo artisan finishing a handcrafted leather instrument bag",
          )}
          className="h-full w-full origin-center animate-slow-zoom object-cover"
          style={{ objectPosition: "center 35%" }}
        />
      </motion.div>

      {/* Cinematic grade */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

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
        style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8"
      >
        <div className="max-w-3xl text-white">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary"
          >
            <span className="h-px w-10 bg-primary/60" />
            {text(about.heroEyebrow, "Our Story")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-5xl font-semibold leading-[1.12] md:text-7xl"
          >
            {text(about.heroHeadingLine1, "Built for the moments")}
            <br />
            <span className="italic text-primary">
              {text(about.heroHeadingLine2, "that matter")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/90"
          >
            {about.heroSubtext}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────── 2. STORY ─────────────────────────── */

/**
 * An editorial spread: a centred masthead, a full-width lead paragraph, then a
 * sticky image against the column that carries the rest of the story.
 */
function Story({ about }: { about: AboutPage }) {
  const { reveal, revealItem, reduceMotion } = useReveal();

  const paragraphs = about.storyParagraphs?.length ? about.storyParagraphs : STORY_PARAGRAPHS;
  const pullQuote = text(about.storyPullQuote, STORY_PULL_QUOTE);
  const chips = about.storyChips ?? [];

  return (
    <section className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      {/* Soft teal wash behind the masthead */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(ellipse_65%_100%_at_50%_0%,var(--primary-light),transparent_72%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Masthead */}
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-8 bg-primary/40" />
            {text(about.storyEyebrow, "How It Started")}
            <span className="h-px w-8 bg-primary/40" />
          </p>
          <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
            {text(about.storyHeading, "Founded by Musicians, for Musicians")}
          </h2>
        </motion.div>

        {/* Lead paragraph — full width, one size up, opening on a drop cap. */}
        <motion.p
          {...reveal}
          className="mx-auto mt-10 max-w-3xl text-lg leading-8 text-foreground first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-primary md:text-xl md:leading-9"
        >
          {text(about.storyLead, STORY_LEAD)}
        </motion.p>

        <div className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* Image rail. Sticks past the h-16 navbar so the frame stays with the
              reader for the whole story instead of scrolling out after paragraph one.
              The reveal lives inside the sticky box — a transform on an ancestor
              would otherwise fight the sticking. */}
          <div className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:max-w-none">
            <div className="lg:sticky lg:top-24">
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduceMotion ? 0.3 : 0.7, ease: EASE }}
                className="relative"
              >
                <div className="overflow-hidden rounded-[2rem] shadow-2xl">
                  <img
                    src={mediaUrl(about.storyImage)}
                    srcSet={mediaSrcSet(about.storyImage)}
                    sizes={SIZES.editorialHalf}
                    alt={mediaAlt(
                      about.storyImage,
                      "A hand-stitched Kailo leather ukulele bag on the workshop bench",
                    )}
                    loading="lazy"
                    decoding="async"
                    className="aspect-4/5 w-full object-cover"
                  />
                </div>

                {/* Floating accent card. The old "100k+ musicians served" was an
                    invented number; this is the claim the homepage already makes. */}
                <div className="absolute -bottom-6 -left-4 rounded-2xl border border-border bg-card/95 px-6 py-4 shadow-xl backdrop-blur sm:-left-6">
                  <p className="font-display text-3xl font-semibold text-primary">
                    {text(about.storyStatValue, "100%")}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {text(about.storyStatLabel, "Hand-finished")}
                  </p>
                </div>
              </motion.div>

              {chips.length > 0 && (
                <motion.div {...reveal} className="mt-14 flex flex-wrap gap-3">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Prose column, with the pull-quote breaking it after the first
              paragraph so the run of body text never gets longer than two. */}
          <div className="lg:col-span-7 lg:border-l lg:border-border lg:pl-14">
            {paragraphs.map((paragraph, i) => (
              <Fragment key={paragraph.slice(0, 48)}>
                <motion.p
                  {...revealItem(i)}
                  className={
                    i === 0
                      ? "text-lg leading-8 text-muted-foreground"
                      : "mt-7 text-lg leading-8 text-muted-foreground"
                  }
                >
                  {paragraph}
                </motion.p>

                {i === 0 && pullQuote && (
                  <motion.figure
                    {...reveal}
                    className="my-10 border-l-2 border-primary/50 pl-6 md:pl-8"
                  >
                    <Quote className="mb-3 h-6 w-6 text-primary/60" aria-hidden="true" />
                    <blockquote className="font-display text-2xl italic leading-snug text-foreground md:text-3xl">
                      {pullQuote}
                    </blockquote>
                  </motion.figure>
                )}
              </Fragment>
            ))}

            <motion.div {...reveal} className="mt-12 flex items-center gap-4">
              <span className="h-px w-16 bg-primary/40" />
              <span className="font-display text-xl italic text-primary">Kailo</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 3. MATERIALS ───────────────────────── */

function Materials({ about }: { about: AboutPage }) {
  const { revealItem } = useReveal();

  const materials = about.materials ?? [];
  if (materials.length === 0) return null;

  return (
    <section className="bg-[var(--bg-soft)] py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          eyebrow={text(about.materialsEyebrow, "What we work in")}
          title={text(about.materialsHeading, "Three materials, chosen on purpose")}
          description={about.materialsDescription}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {materials.map((material, i) => (
            <motion.article
              key={material.name}
              {...revealItem(i)}
              className="group overflow-hidden rounded-[1.75rem] border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative overflow-hidden">
                <img
                  src={mediaUrl(material.image)}
                  srcSet={mediaSrcSet(material.image)}
                  sizes={SIZES.categoryTile}
                  alt={mediaAlt(material.image, `${material.name} — a Kailo strap in close-up`)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-4/3 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 font-display text-xs font-semibold tracking-widest text-ink backdrop-blur">
                  {ordinal(i)}
                </span>
              </div>

              <div className="p-7">
                <h3 className="font-display text-2xl font-semibold">{material.name}</h3>
                {material.meta && (
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {material.meta}
                  </p>
                )}
                <p className="mt-4 leading-relaxed text-muted-foreground">{material.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 4. WHERE THE DETAIL LIVES ─────────────────── */

/**
 * The story's third paragraph, turned into the three places you can feel it —
 * every stitch, every strap, every lining — against the detail film. The one
 * saturated band on the page, so the scroll has a break in it; it shares its
 * teal ground and inked type with the homepage's film band.
 *
 * Unlike the other bands, this one no longer bails on an empty repeatable: the
 * film and the copy beside it stand on their own, so an editor who has not
 * written the three details yet gets a band rather than a gap. Only the list
 * itself is conditional.
 */
function Craft({ about }: { about: AboutPage }) {
  const { reveal, revealItem, reduceMotion } = useReveal();

  const details = about.craftDetails ?? [];

  return (
    <section className="relative overflow-hidden bg-[var(--film-band)] py-24 text-[var(--ink)] sm:py-28 lg:py-32">
      {/* Light and shade washed into the flat teal, kept well behind the type. On
          this ground white reads as haze where a teal glow would go muddy. */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[var(--primary-dark)]/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: reduceMotion ? 0.3 : 0.7, ease: EASE }}
            className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-none"
          >
            {/* The one moving frame on the page, and the section that earns it:
                a macro pass over the brass and the stitch line says more than a
                still can. `about.craftImage` is deliberately not read here — the
                film brings its own poster, so the two never cross-fade. The 4:5
                crop takes the generator's watermark off the right edge with it. */}
            <div className="overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/10">
              <VideoLoop
                src={filmDetail}
                poster={filmDetailPoster}
                label="A close pass over the brass buckle and stitching on a grey leather Kailo bag, then the range of cases on a workshop shelf"
                className="aspect-4/5 w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-2xl border border-[var(--ink)]/20 bg-white/30 px-5 py-3 backdrop-blur sm:-right-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink)]/75">
                On the bench
              </p>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div {...reveal}>
              <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--ink)]/75">
                <span className="h-px w-8 bg-[var(--ink)]/30" />
                {text(about.craftEyebrow, "The little things")}
              </p>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.1] md:text-5xl">
                {text(about.craftHeading, "Where the detail lives")}
              </h2>
              {about.craftDescription && (
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink)]/75">
                  {about.craftDescription}
                </p>
              )}
            </motion.div>

            {details.length > 0 && (
              <ul className="mt-12 space-y-4">
                {details.map((detail, i) => {
                  // The CMS stores the lucide component's name, not markup.
                  const Icon = getIcon(detail.icon);

                  return (
                    <motion.li
                      key={detail.title}
                      {...revealItem(i)}
                      className="flex gap-5 rounded-2xl border border-[var(--ink)]/15 bg-white/25 p-5 backdrop-blur transition-colors hover:border-[var(--ink)]/25 hover:bg-white/40 sm:p-6"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/50 text-[var(--ink)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{detail.title}</h3>
                        <p className="mt-1.5 leading-relaxed text-[var(--ink)]/75">{detail.body}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 5. MISSION & VALUES ─────────────────────── */

function Values({ about }: { about: AboutPage }) {
  const { revealItem } = useReveal();

  const values = about.values ?? [];
  if (values.length === 0) return null;

  return (
    <section className="py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHead
          eyebrow={text(about.valuesEyebrow, "What we stand for")}
          title={text(about.valuesHeading, "Mission & values")}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, i) => {
            // The CMS stores the lucide component's name, not markup.
            const Icon = getIcon(value.icon);

            return (
              <motion.div
                key={value.title}
                {...revealItem(i)}
                className="group rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-4xl font-semibold text-border">
                    {ordinal(i)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{value.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── 6. WHO CARRIES KAILO ───────────────────── */

function Audience({ about }: { about: AboutPage }) {
  const { revealItem } = useReveal();

  const audiences = about.audiences ?? [];
  if (audiences.length === 0) return null;

  return (
    <section className="bg-[var(--bg-soft)] py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHead
          eyebrow={text(about.audienceEyebrow, "Who carries Kailo")}
          title={text(about.audienceHeading, "Made for the way you play")}
          description={about.audienceDescription}
        />

        {/* Hairline grid rather than another row of cards — the values band
            above is already cards, and two in a row read as one long list. */}
        <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border sm:grid-cols-2">
          {audiences.map((audience, i) => {
            const Icon = getIcon(audience.icon);

            return (
              <motion.div
                key={audience.title}
                {...revealItem(i)}
                className="group flex gap-5 bg-background p-8 transition-colors hover:bg-card sm:p-10"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{audience.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{audience.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 7. CTA ─────────────────────────── */

function ClosingCta({ cta }: { cta: AboutPage["cta"] }) {
  const { reveal } = useReveal();

  return (
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
            {text(cta?.heading, "Carry your music with pride")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">{cta?.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CmsLink
              href={cta?.buttonHref}
              fallbackHref="/products"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-primary transition hover:bg-white/90"
            >
              {text(cta?.buttonLabel, "Shop the Collection")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </CmsLink>
            {cta?.secondaryButtonLabel && (
              <CmsLink
                href={cta.secondaryButtonHref}
                fallbackHref="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-primary"
              >
                {cta.secondaryButtonLabel}
              </CmsLink>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────── SHARED ─────────────────────────── */

/** Centred eyebrow + heading + optional lede, shared by the three card bands. */
function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
}) {
  const { reveal } = useReveal();

  return (
    <motion.div {...reveal} className="mx-auto mb-14 max-w-2xl text-center">
      <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
        <span className="h-px w-8 bg-primary/40" />
        {eyebrow}
        <span className="h-px w-8 bg-primary/40" />
      </p>
      <h2 className="mt-5 text-balance text-4xl font-semibold md:text-5xl">{title}</h2>
      {description && (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}

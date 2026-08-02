import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Volume2 } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { VideoLoop } from "@/components/VideoLoop";

import { getIcon } from "@/lib/icons";
import { aboutPageQuery, type AboutPage, type Material } from "@/lib/queries";
import { mediaAlt, mediaSrcSet, mediaUrl, SIZES } from "@/lib/strapi";

// Bundled with the app rather than CMS-managed — the CMS models images only, and
// this is fixed brand footage. The poster is a still from the clip's own opening.
import filmWorkshop from "@/assets/videos/workshop-sunset.mp4";
import filmWorkshopPoster from "@/assets/videos/posters/workshop-sunset.jpg";
import filmBrass from "@/assets/videos/brass-and-stitching.mp4";
import filmBrassPoster from "@/assets/videos/posters/brass-and-stitching.jpg";

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
 * Applied to the short, layout-bearing strings — eyebrows, headings — where an
 * empty field would leave a visible hole. Body paragraphs are rendered as-is, and
 * a band whose repeatable component is empty is skipped entirely rather than
 * rendered as a heading over nothing.
 */
const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

/**
 * The brand story, used when the CMS comes back empty — verbatim, as supplied.
 *
 * The one exception to the rule above: an empty story would leave the whole
 * editorial column blank beside a full-height image, so it falls back rather
 * than collapsing.
 */
const STORY_LEAD =
  "Kailo began with a simple idea and a deep love for music. Founded by an amateur ukulele player, Kailo was born from the belief that every musician deserves to carry their instrument with pride, style, and confidence. A ukulele is more than just an instrument—it's a companion, a passion, and a part of who you are. We believed its case should reflect that.";

const STORY_PARAGRAPHS = [
  "Every Kailo bag is crafted with meticulous attention to detail—from the precision of every stitch to the comfort of every strap and the softness of every lining. Because we know it's the little things that make a big difference.",
  "Today, Kailo accompanies touring artists, passionate hobbyists, bedroom songwriters, and music students throughout the country, expanding its footprint to the entire world. While our community has grown, our purpose remains unchanged: to create beautifully crafted bags that protect the instruments musicians love and inspire them to carry their music with confidence.",
];

/**
 * The two workshop films, in the order they stack. Both are bundled brand footage
 * rather than CMS media, and both carry their own poster — a still from the clip's
 * own opening second. `label` is what the footage shows, for assistive tech.
 */
const FILMS = [
  {
    src: filmWorkshop,
    poster: filmWorkshopPoster,
    title: "The bench at golden hour",
    label:
      "A slow pass across a sunlit workshop bench: a mahogany ukulele beside a grey Kailo bag, wood shavings and hand tools, the sun setting through the window behind",
  },
  {
    src: filmBrass,
    poster: filmBrassPoster,
    title: "Brass and stitching",
    label:
      "A close pass over the brass buckle and stitch line on a grey leather Kailo bag, then the range of cases on a workshop shelf",
  },
];

/** Two digits, so "01 / 02" line up under a display face. */
const ordinal = (i: number) => String(i + 1).padStart(2, "0");

/* ──────────────────────────── MOTION ──────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The page's scroll-reveal props, flattened to a plain fade for a visitor who
 * asked for less motion.
 *
 * Two rules keep the scroll calm, and both were learned the hard way:
 *
 * 1. **Fire before the element arrives.** `margin` is an IntersectionObserver
 *    root margin, so the negative value this used to carry (`-80px`) delayed the
 *    trigger until the block was already 80px inside the viewport — every section
 *    visibly assembled itself under the reader's eye. A positive bottom margin
 *    grows the root downwards instead, so a block starts moving while it is still
 *    below the fold and has settled by the time it can be read.
 *
 * 2. **Only ever move up.** Sideways reveals fight the scroll direction; a short
 *    rise goes with it. Nothing on this page slides horizontally.
 *
 * The stylesheet's `prefers-reduced-motion` block only reaches CSS animations
 * and transitions — framer-motion writes inline transforms, so the offset has to
 * be dropped here instead.
 */
function useReveal() {
  const reduceMotion = useReducedMotion() ?? false;

  return useMemo(() => {
    const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 };
    const shown = { opacity: 1, y: 0 };
    const viewport = { once: true, margin: "0px 0px 220px 0px" } as const;

    return {
      reveal: {
        initial: hidden,
        whileInView: shown,
        viewport,
        transition: { duration: reduceMotion ? 0.3 : 0.5, ease: EASE },
      },
      revealItem: (i: number) => ({
        initial: hidden,
        whileInView: shown,
        viewport,
        transition: {
          duration: reduceMotion ? 0.3 : 0.45,
          // Capped: a longer list must not leave its tail still arriving once the
          // reader has caught up with it.
          delay: reduceMotion ? 0 : Math.min(i, 3) * 0.06,
          ease: EASE,
        },
      }),
    };
  }, [reduceMotion]);
}

/* ──────────────────────────── PAGE ──────────────────────────── */

/**
 * Four bands, each with a layout of its own so the scroll never repeats itself:
 * a full-bleed hero, the story as an editorial spread, the workshop films and the
 * materials running side by side across a two-tone band, and a single hairline row
 * of audiences to close.
 */
function About() {
  const { about } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero about={about} />
      <Story about={about} />
      <Workshop about={about} />
      <Audience about={about} />
    </SiteLayout>
  );
}

/* ─────────────────────────── 1. HERO ─────────────────────────── */

/**
 * A full-bleed hero: the photograph is the ground, not a framed panel beside the
 * type. One heading, one line of support, one button.
 *
 * The scrim is white rather than the dimming stack the page used to open on. This
 * photograph is a light interior, so ink type over a white wash reads at full
 * contrast without darkening the image or reaching for grain and a vignette — and
 * it keeps the hero in the same key as the rest of the page.
 *
 * The stops still tighten as the viewport narrows, but by less than they did. They
 * were set against a square photograph whose mid-tone case lining landed directly
 * under the words on a tall crop; the panoramic bench that replaced it has no such
 * dark passage, and a portrait viewport crops it to its palest strip. Carrying the
 * old weights over that put a near-white wash on near-white pixels and left the
 * band reading as blank rather than photographic.
 */
function Hero({ about }: { about: AboutPage }) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // The image drifts as the hero scrolls away. The wrapper is oversized by the
  // same amount it can travel, so the drift never pulls an edge into frame.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const entrance = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.3 : 0.7, delay: reduceMotion ? 0 : delay, ease: EASE },
  });

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[78svh] min-h-[30rem] max-h-[46rem] items-center overflow-hidden"
    >
      <motion.div
        style={reduceMotion ? undefined : { y: imageY }}
        className="absolute -top-[7%] left-0 h-[114%] w-full will-change-transform"
      >
        <img
          src={mediaUrl(about.heroImage)}
          srcSet={mediaSrcSet(about.heroImage)}
          sizes={SIZES.fullWidth}
          alt={mediaAlt(
            about.heroImage,
            "The Kailo workshop bench in window light, a teal leather strap laid out among the tools",
          )}
          className="h-full w-full origin-center animate-slow-zoom object-cover"
          // Centred, because the frame is now wider than the band rather than
          // taller: a 2.33:1 photograph in a ~1.8:1 box is trimmed at the sides
          // and keeps its full height, so a vertical bias would do nothing. The
          // buckle and strap sit dead centre, which is also what survives the
          // much harder side-crop a portrait phone viewport takes.
          style={{ objectPosition: "center" }}
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/90 via-white/62 to-white/25 sm:via-white/55 sm:to-white/10 lg:via-white/45 lg:to-transparent" />

      {/* Seats the photograph on the section below instead of ending it on a line. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl">
          <motion.p
            {...entrance(0)}
            className="inline-flex rounded-full border border-primary/25 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-primary backdrop-blur"
          >
            {text(about.heroEyebrow, "Our Story")}
          </motion.p>

          <motion.h1
            {...entrance(0.08)}
            className="mt-7 text-balance text-[2.75rem] font-semibold leading-[1.05] sm:text-6xl xl:text-7xl"
          >
            {text(about.heroHeadingLine1, "Built for the moments")}
            <br />
            <span className="italic text-primary">
              {text(about.heroHeadingLine2, "that matter")}
            </span>
          </motion.h1>

          {about.heroSubtext && (
            <motion.p
              {...entrance(0.16)}
              className="mt-6 max-w-md text-lg leading-relaxed text-foreground/70"
            >
              {about.heroSubtext}
            </motion.p>
          )}

          {/* The page's only button. The closing CTA band it replaces was two
              buttons and a heading, all of it repeating the navbar. */}
          <motion.div {...entrance(0.24)} className="mt-9">
            <Link
              to="/products"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] hover:shadow-xl hover:shadow-primary/30"
            >
              Explore the collection
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 2. STORY ─────────────────────────── */

/**
 * An editorial spread: a sticky image rail on the left against the column that
 * carries the whole story on the right, opening on a drop cap.
 *
 * `about.storyPullQuote` is deliberately not read. The quote it holds is a
 * sentence out of `storyLead`, so setting it in a card mid-column printed the
 * same line twice a screen apart.
 */
function Story({ about }: { about: AboutPage }) {
  const { reveal, revealItem } = useReveal();

  const paragraphs = about.storyParagraphs?.length ? about.storyParagraphs : STORY_PARAGRAPHS;
  const chips = about.storyChips ?? [];

  return (
    <section className="py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Image rail. Sticks past the h-16 navbar so the frame stays with the
              reader for the whole story instead of scrolling out after paragraph
              one. The reveal lives inside the sticky box — a transform on an
              ancestor would otherwise fight the sticking. */}
          <div className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:max-w-none">
            <div className="lg:sticky lg:top-24">
              <motion.div {...reveal}>
                <div className="overflow-hidden rounded-[2rem] shadow-xl shadow-black/10">
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
                    className="aspect-4/5 w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
                  />
                </div>
              </motion.div>

              {chips.length > 0 && (
                <motion.ul {...reveal} className="mt-8 flex flex-wrap gap-2.5">
                  {chips.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full border border-border bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {chip}
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <motion.div {...reveal}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {text(about.storyEyebrow, "How it started")}
              </p>
              <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
                {text(about.storyHeading, "Founded by musicians, for musicians")}
              </h2>
            </motion.div>

            {/* Lead, one size up and opening on a drop cap. */}
            <motion.p
              {...reveal}
              className="mt-8 text-lg leading-8 text-foreground first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-primary md:text-xl md:leading-9"
            >
              {text(about.storyLead, STORY_LEAD)}
            </motion.p>

            {paragraphs.map((paragraph, i) => (
              <motion.p
                key={paragraph.slice(0, 48)}
                {...revealItem(i)}
                className="mt-7 text-lg leading-8 text-muted-foreground"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 3. WORKSHOP & MATERIALS ─────────────────── */

/**
 * The page's centrepiece: one band split down the middle, the three materials on
 * the soft light left half and the film on the dark right half.
 *
 * Two grounds, one section. The split lands on the viewport's centre line because
 * the shell is centred and the grid has no gap — the columns pay for their own
 * inner spacing with padding instead, so the colour change and the column
 * boundary are the same line. Give the grid a `gap` and they drift apart.
 *
 * The film column sticks: three materials are much taller than one film, and a
 * pinned frame keeps the workshop present for the whole scroll rather than
 * leaving half a screen of empty dark.
 */
function Workshop({ about }: { about: AboutPage }) {
  const materials = about.materials ?? [];

  // Nothing to sit beside, so there is no split to draw: the films take the whole
  // band, as they did before the two halves were paired up.
  if (materials.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[var(--film-band)] py-20 text-[var(--ink)] sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute -right-32 top-1/4 h-[30rem] w-[30rem] rounded-full bg-white/25 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <FilmColumn about={about} />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* The soft light half is the base; the teal half is laid over its right
          side. Each keeps its bloom inside its own `overflow-hidden` box so
          neither bleeds across the seam. */}
      <div className="pointer-events-none absolute inset-0 bg-[var(--bg-soft)]" />

      {/* Desktop only: below `lg` the halves stack into bands and the film column
          carries the teal ground itself, so an overlay here would put the
          materials on it too.

          On this mid-tone teal, white reads as haze where a teal glow would go
          muddy — the same pair of washes the homepage film band uses. */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden overflow-hidden bg-[var(--film-band)] lg:block">
        <div className="absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[var(--primary-dark)]/20 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-1/2 hidden overflow-hidden lg:block">
        <div className="absolute right-1/4 top-16 h-[24rem] w-[24rem] rounded-full bg-[var(--primary-light)] opacity-80 blur-3xl" />
      </div>

      {/* No `gap` — see the note above. The teal half's own background is only
          needed below `lg`, where the two halves stack into bands: materials
          first, then the films. */}
      <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-2">
        <div className="px-6 py-20 sm:py-24 lg:py-28 lg:pl-8 lg:pr-12">
          <MaterialsColumn about={about} materials={materials} />
        </div>

        {/* Both halves start at the top, so the two eyebrows and the two headings
            sit on the same lines across the split — that shared baseline is the
            only thing tying the halves together, and centring this one to hide a
            trailing gap cost more than the gap did. Not sticky either: a sticky
            box taller than the viewport can never be scrolled to its own bottom.

            What is left over at the bottom is closed from both ends instead —
            the films take the wider share of the split below, and the materials
            opposite are set a little tighter. */}
        <div className="bg-[var(--film-band)] px-6 py-20 text-[var(--ink)] sm:py-24 lg:bg-transparent lg:py-28 lg:pl-12 lg:pr-8">
          <FilmColumn about={about} />
        </div>
      </div>
    </section>
  );
}

/**
 * The two workshop films and their copy, sized for a half-width column.
 *
 * The head runs the full column; below it the column splits again, films on the
 * left and the craft details on the right. That inner split holds at every width
 * rather than stacking on small screens, which is what makes both sides narrow
 * enough to need their own scaled-down internals.
 *
 * Each frame runs as a silent ambient loop until it is clicked, and then becomes a
 * real player — sound, controls and all — in place. Only one holds the sound: the
 * state lives here rather than in the frames, so starting the second drops the
 * first back to a silent loop. `about.craftImage` is deliberately not read — the
 * films bring their own posters, so nothing cross-fades.
 */
function FilmColumn({ about }: { about: AboutPage }) {
  const { reveal, revealItem } = useReveal();
  const [sounded, setSounded] = useState<number | null>(null);

  const details = about.craftDetails ?? [];

  return (
    <motion.div {...reveal}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--ink)]/70">
        {text(about.craftEyebrow, "In the workshop")}
      </p>
      <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
        {text(about.craftHeading, "From hide to handle")}
      </h2>
      {about.craftDescription && (
        <p className="mt-6 text-lg leading-relaxed text-[var(--ink)]/75">
          {about.craftDescription}
        </p>
      )}

      {sounded === null && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/20 bg-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink)]/80 backdrop-blur">
          <Volume2 className="h-3.5 w-3.5" />
          Tap either film for sound
        </p>
      )}

      {/* The details sit beside the films rather than under them, at every width
          — so this stays a two-up split on a phone as well, where it is only
          ~170px a side. That budget is what sizes everything inside: see the
          card below and the frame internals in `FilmFrame`.

          The films take the wider share of the split from `lg`. A portrait frame
          turns width into height faster than wrapped copy does, so handing the
          films the extra is what brings this column closest to the materials
          opposite — the cards pay for it with a line of wrap, nothing more.

          That leaves the films the taller of the two, so from `lg` the cards
          stretch to meet them (`items-stretch`, each card `flex-1`) rather than
          ending 200px short of the last frame and putting the gap back inside
          the column. Below `lg` the cards are the taller side and `items-start`
          is what stops the films from being stretched to match. With no details
          to place there is no split at all, and the films take the column back
          at full width. */}
      <div
        className={
          details.length > 0
            ? "mt-8 grid grid-cols-2 items-start gap-3 sm:gap-5 lg:mt-10 lg:grid-cols-[1.15fr_1fr] lg:items-stretch lg:gap-6"
            : "mt-8"
        }
      >
        <div className="space-y-4 sm:space-y-5 lg:space-y-7">
          {FILMS.map((film, i) => (
            <FilmFrame
              key={film.title}
              film={film}
              sounded={sounded === i}
              onPlay={() => setSounded(i)}
            />
          ))}
        </div>

        {details.length > 0 && (
          <ul className="space-y-3 sm:space-y-4 lg:flex lg:flex-col lg:space-y-0 lg:gap-4">
            {details.map((detail, i) => {
              // The CMS stores the lucide component's name, not markup.
              const Icon = getIcon(detail.icon);

              return (
                <motion.li
                  key={detail.title}
                  {...revealItem(i)}
                  // Icon over the copy, not beside it: at half a half-column
                  // there is no width to spend on a 44px gutter. It only turns
                  // back into a row at `xl`, where the card clears ~270px.
                  className="flex flex-col gap-2.5 rounded-2xl border border-[var(--ink)]/15 bg-white/25 p-4 backdrop-blur transition-colors hover:border-[var(--ink)]/25 hover:bg-white/40 sm:gap-3 sm:p-5 lg:flex-1 xl:flex-row xl:gap-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/50 text-[var(--ink)] sm:h-11 sm:w-11">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="block">
                    <span className="block text-sm font-semibold sm:text-base">{detail.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--ink)]/75 sm:mt-1.5 sm:text-sm">
                      {detail.body}
                    </span>
                  </span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

/**
 * One film frame: an ambient loop with a play button, or the real player once it
 * has been asked for.
 *
 * The crop is load-bearing, not compositional. Both clips carry a generator
 * watermark at x 88.8–92.4% of the frame, and a window narrower than the 16:9
 * source anchored left takes the mark off with the right edge: 4:3 shows x 0–75%,
 * `aspect-square` only x 0–56%. Widen past 3:2 and the mark comes back — so this
 * ratio is safe to make *taller*, never wider.
 *
 * Which ratio applies tracks how wide the frame actually is, because the whole
 * job here is running the films to about the same length as the three cards
 * beside them:
 *
 *   base  3:4  — ~165px a frame on a phone, so the ratio has to be portrait to
 *                get anywhere near three cards of wrapped copy. 4:3 here is only
 *                ~124px tall and the films end less than halfway down them.
 *   sm    4:3  — the band is still full width, so a frame is ~380px and landscape
 *                is what keeps it from towering past the cards instead.
 *   lg    5:6  — the band splits into halves, and the films take the wider share
 *                of the split, so a frame is ~290px.
 *
 * Every one of these is narrower than the 16:9 source, so the watermark stays off
 * the right edge at all three. The ratio is only ever safe to make taller.
 *
 * Everything laid over the frame is sized off the frame, not the viewport. Sharing
 * the column with the detail cards halves it — ~170px on a phone, ~270px at `xl` —
 * so the corner radius, the play disc and the caption all step up with the
 * breakpoint instead of sitting at one full-width size. A 56px disc on a 170px
 * frame covers a third of the shot.
 */
function FilmFrame({
  film,
  sounded,
  onPlay,
}: {
  film: (typeof FILMS)[number];
  sounded: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-black/10 sm:rounded-3xl lg:rounded-[2rem]">
      {sounded ? (
        <video
          src={film.src}
          poster={film.poster}
          aria-label={film.label}
          controls
          autoPlay
          loop
          playsInline
          className="aspect-3/4 w-full object-cover sm:aspect-4/3 lg:aspect-3/4 xl:aspect-5/6"
          style={{ objectPosition: "left center" }}
        />
      ) : (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play “${film.title}” with sound`}
          className="group relative block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--film-band)]"
        >
          <VideoLoop
            src={film.src}
            poster={film.poster}
            label={film.label}
            style={{ objectPosition: "left center" }}
            className="aspect-3/4 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:aspect-4/3 lg:aspect-3/4 xl:aspect-5/6"
          />

          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            {/* Solid rather than glass: both posters are bright, and a translucent
                disc all but disappears against them. */}
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-xl shadow-black/25 ring-1 ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-white sm:h-12 sm:w-12 lg:h-14 lg:w-14">
              <Play className="ml-0.5 h-4 w-4 fill-current sm:h-5 sm:w-5" />
            </span>
          </span>

          {/* Two lines of caption on a frame this narrow, so it is set tighter and
              smaller than the full-width version was — a phone frame fits roughly
              14 characters a line at `text-xs`. */}
          <span className="pointer-events-none absolute inset-x-3 bottom-3 text-left text-[0.625rem] font-semibold uppercase leading-snug tracking-[0.1em] text-white/90 sm:inset-x-4 sm:bottom-3.5 sm:tracking-[0.14em] lg:inset-x-5 lg:bottom-4 lg:text-xs lg:tracking-[0.18em]">
            {film.title}
          </span>
        </button>
      )}
    </div>
  );
}

/** The head and the three material cards, sized for a half-width column. */
function MaterialsColumn({ about, materials }: { about: AboutPage; materials: Material[] }) {
  const { reveal, revealItem } = useReveal();

  return (
    <>
      <motion.div {...reveal}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {text(about.materialsEyebrow, "What we work in")}
        </p>
        <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
          {text(about.materialsHeading, "Three materials, chosen on purpose")}
        </h2>
        {about.materialsDescription && (
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {about.materialsDescription}
          </p>
        )}
      </motion.div>

      <div className="mt-9 space-y-4">
        {materials.map((material, i) => (
          <motion.article
            key={material.name}
            {...revealItem(i)}
            className="group flex gap-5 rounded-[1.75rem] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 sm:gap-6 sm:p-5"
          >
            {/* Stretches to the card rather than carrying its own ratio, so a
                three-line body and a five-line one both come out flush. */}
            <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-[1.25rem] sm:w-32 lg:w-36">
              <img
                src={mediaUrl(material.image)}
                srcSet={mediaSrcSet(material.image)}
                // A thumbnail now, not a half-page frame: this lands on Strapi's
                // 400px candidate at either density, which is the smallest of
                // these PNG renders that is not the 125px one.
                sizes="(min-width: 1024px) 9rem, 7rem"
                alt={mediaAlt(material.image, `${material.name} — a Kailo strap in close-up`)}
                loading="lazy"
                decoding="async"
                className="h-full min-h-40 w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.06]"
              />
            </div>

            <div className="min-w-0 pt-1">
              <span className="font-display text-sm font-semibold text-primary">{ordinal(i)}</span>

              <h3 className="mt-2 font-display text-2xl font-semibold">{material.name}</h3>

              {material.meta && (
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {material.meta}
                </p>
              )}

              <p className="mt-3 leading-relaxed text-muted-foreground">{material.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </>
  );
}

/* ───────────────────── 4. WHO CARRIES KAILO ───────────────────── */

/**
 * The page's close, and its only centred head: one hairline-divided row rather
 * than another set of cards, so it reads as a footnote to everything above it.
 */
function Audience({ about }: { about: AboutPage }) {
  const { reveal, revealItem } = useReveal();

  const audiences = about.audiences ?? [];
  if (audiences.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {text(about.audienceEyebrow, "Who carries Kailo")}
          </p>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
            {text(about.audienceHeading, "Made for the way you play")}
          </h2>
          {about.audienceDescription && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {about.audienceDescription}
            </p>
          )}
        </motion.div>

        {/* Hairlines are the grid's own background showing through a 1px gap —
            it divides cleanly at every breakpoint without nth-child rules. */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, i) => {
            const Icon = getIcon(audience.icon);

            return (
              // The cell keeps its own opaque background and only its contents
              // fade in. Animating the cell would let the grid's hairline colour
              // show through the whole tile for the length of the stagger.
              <div
                key={audience.title}
                className="group bg-card p-8 transition-colors duration-300 hover:bg-[var(--bg-soft)] sm:p-9"
              >
                <motion.div {...revealItem(i)}>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{audience.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-muted-foreground">{audience.body}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

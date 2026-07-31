import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SiteLayout } from "@/components/SiteLayout";
import { Lightbox } from "@/components/Lightbox";
import { galleryQuery } from "@/lib/queries";
import { SIZES } from "@/lib/strapi";

// The page's own hero has no CMS home — see "Known gaps" in the backend README.
import aiRestringing from "@/assets/lifestyle/restringing.png";

export const Route = createFileRoute("/gallery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery()),
  head: () => ({
    meta: [
      { title: "Gallery — Kailo" },
      {
        name: "description",
        content: "A visual journey through Kailo accessories, lifestyle moments and events.",
      },
      { property: "og:title", content: "Gallery — Kailo" },
      { property: "og:description", content: "Visual moments from the Kailo world." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

type Cat = "All" | "Products" | "Lifestyle" | "Events";

/** `"All"` is a UI-only pill; the CMS deliberately stores only the other three. */
const CATS: Cat[] = ["All", "Products", "Lifestyle", "Events"];

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Gallery() {
  const images = Route.useLoaderData();
  const [cat, setCat] = useState<Cat>("All");
  const [open, setOpen] = useState<number | null>(null);

  const filtered = images.filter((i) => cat === "All" || i.cat === cat);
  const count = filtered.length;

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(() => setOpen((o) => (o === null ? o : (o + 1) % count)), [count]);
  const prev = useCallback(
    () => setOpen((o) => (o === null ? o : (o - 1 + count) % count)),
    [count],
  );

  return (
    <SiteLayout>
      {/* ───────────────────────── HERO ──────────────────────── */}
      <section className="relative flex h-[70vh] min-h-[520px] items-center overflow-hidden bg-black">
        {/* Full-bleed hero */}
        <img
          src={aiRestringing}
          alt="A musician restringing a guitar in the Kailo workshop"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Legibility grade — dark on the left where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

        <motion.div {...reveal} className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Gallery
            </p>
            <h1 className="text-4xl font-semibold md:text-6xl">Moments with Kailo</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              A visual journey through our accessories, the artists who carry them, and the moments
              in between.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────── FILTER + MASONRY ───────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-[var(--bg-soft)] text-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((img, i) => (
              <motion.button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => setOpen(i)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: (i % 4) * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes={SIZES.masonry}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full transition-transform duration-500 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                  {img.cat}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {open !== null && (
          <Lightbox
            src={filtered[open].src}
            alt={`${filtered[open].alt}, enlarged`}
            index={open}
            total={count}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}

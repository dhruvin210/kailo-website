import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SiteLayout } from "@/components/SiteLayout";
import { Lightbox } from "@/components/Lightbox";

import photo01 from "@/assets/gallery/photo01.jpeg";
import photo02 from "@/assets/gallery/photo02.jpeg";
import photo03 from "@/assets/gallery/photo03.jpeg";
import photo04 from "@/assets/gallery/photo04.jpeg";
import photo05 from "@/assets/gallery/photo05.jpeg";
import photo06 from "@/assets/gallery/photo06.jpeg";
import photo07 from "@/assets/gallery/photo07.jpeg";
import photo08 from "@/assets/gallery/photo08.jpeg";
import photo09 from "@/assets/gallery/photo09.jpeg";
import photo10 from "@/assets/gallery/photo10.jpeg";
import photo11 from "@/assets/gallery/photo11.jpeg";
import photo12 from "@/assets/gallery/photo12.jpeg";
import photo13 from "@/assets/gallery/photo13.jpeg";
import photo14 from "@/assets/gallery/photo14.jpeg";
import photo15 from "@/assets/gallery/photo15.jpeg";
import photo16 from "@/assets/gallery/photo16.jpeg";
import photo17 from "@/assets/gallery/photo17.jpeg";
import photo18 from "@/assets/gallery/photo18.jpeg";
import photo19 from "@/assets/gallery/photo19.jpeg";
import photo20 from "@/assets/gallery/photo20.jpeg";
import photo21 from "@/assets/gallery/photo21.jpeg";
import photo22 from "@/assets/gallery/photo22.jpeg";
import photo23 from "@/assets/gallery/photo23.jpeg";
import photo24 from "@/assets/gallery/photo24.jpeg";

// AI-generated, on-brand Kailo photography
import aiUkuleleCase from "@/assets/products/ukulele-case.png";
import aiViolinCase from "@/assets/products/violin-case.png";
import aiLeatherStrap from "@/assets/products/leather-strap.png";
import aiClipTuner from "@/assets/products/clip-tuner.png";
import aiPickSet from "@/assets/products/pick-set.png";
import aiCleaningKit from "@/assets/products/cleaning-kit.png";
import aiRestringing from "@/assets/lifestyle/restringing.png";
import aiUkuleleWindow from "@/assets/lifestyle/ukulele-window.png";
import aiWorkbench from "@/assets/lifestyle/workbench.png";
import aiArtisan from "@/assets/lifestyle/artisan.png";

export const Route = createFileRoute("/gallery")({
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
const CATS: Cat[] = ["All", "Products", "Lifestyle", "Events"];

const IMAGES: { src: string; cat: Exclude<Cat, "All"> }[] = [
  // Featured AI-generated Kailo photography
  { src: aiUkuleleCase, cat: "Products" },
  { src: aiLeatherStrap, cat: "Products" },
  { src: aiArtisan, cat: "Lifestyle" },
  { src: aiViolinCase, cat: "Products" },
  { src: aiWorkbench, cat: "Lifestyle" },
  { src: aiPickSet, cat: "Products" },
  { src: aiUkuleleWindow, cat: "Lifestyle" },
  { src: aiClipTuner, cat: "Products" },
  { src: aiCleaningKit, cat: "Products" },
  { src: photo01, cat: "Events" },
  { src: photo15, cat: "Products" },
  { src: photo02, cat: "Lifestyle" },
  { src: photo03, cat: "Lifestyle" },
  { src: photo04, cat: "Lifestyle" },
  { src: photo05, cat: "Lifestyle" },
  { src: photo06, cat: "Lifestyle" },
  { src: photo07, cat: "Lifestyle" },
  { src: photo08, cat: "Lifestyle" },
  { src: photo09, cat: "Lifestyle" },
  { src: photo10, cat: "Lifestyle" },
  { src: photo11, cat: "Lifestyle" },
  { src: photo12, cat: "Lifestyle" },
  { src: photo13, cat: "Lifestyle" },
  { src: photo14, cat: "Lifestyle" },
  { src: photo16, cat: "Lifestyle" },
  { src: photo17, cat: "Events" },
  { src: photo18, cat: "Events" },
  { src: photo19, cat: "Lifestyle" },
  { src: photo20, cat: "Lifestyle" },
  { src: photo21, cat: "Lifestyle" },
  { src: photo22, cat: "Lifestyle" },
  { src: photo23, cat: "Lifestyle" },
  { src: photo24, cat: "Lifestyle" },
];

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Gallery() {
  const [cat, setCat] = useState<Cat>("All");
  const [open, setOpen] = useState<number | null>(null);

  const filtered = IMAGES.filter((i) => cat === "All" || i.cat === cat);
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
                key={img.src}
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
                  alt={`Kailo ${img.cat.toLowerCase()} moment`}
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
            alt={`Kailo ${filtered[open].cat.toLowerCase()} moment, enlarged`}
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

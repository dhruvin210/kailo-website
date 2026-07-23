import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";

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

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Kailo" },
      {
        name: "description",
        content:
          "A visual journey through Kailo accessories, lifestyle moments and events.",
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
  const next = useCallback(
    () => setOpen((o) => (o === null ? o : (o + 1) % count)),
    [count]
  );
  const prev = useCallback(
    () => setOpen((o) => (o === null ? o : (o - 1 + count) % count)),
    [count]
  );

  return (
    <SiteLayout>
      {/* ───────────────────────── HEADER ──────────────────────── */}
      <section className="border-b border-border bg-[var(--bg-soft)] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Gallery
            </p>
            <h1 className="text-4xl font-semibold md:text-5xl">
              Moments with Kailo
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              A visual journey through our accessories, the artists who carry
              them, and the moments in between.
            </p>
          </motion.div>
        </div>
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
            cat={filtered[open].cat}
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

/* ─────────────────────────── LIGHTBOX ─────────────────────────── */

function Lightbox({
  src,
  cat,
  index,
  total,
  onClose,
  onNext,
  onPrev,
}: {
  src: string;
  cat: string;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard nav + focus trap + body scroll lock.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog for screen readers / keyboard users.
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "Tab") {
        // Trap focus within the dialog's focusable controls.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], [tabindex]:not([tabindex='-1'])"
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose, onNext, onPrev]);

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${total}`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md outline-none sm:p-8"
    >
      {/* Counter */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
        {index + 1} / {total}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Previous image"
        className="absolute left-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-6"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Image */}
      <motion.img
        key={src}
        src={src}
        alt={`Kailo ${cat.toLowerCase()} moment, enlarged`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />

      {/* Next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next image"
        className="absolute right-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </motion.div>
  );
}

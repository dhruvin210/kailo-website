import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
      { name: "description", content: "A visual journey through Kailo accessories, lifestyle moments and events." },
      { property: "og:title", content: "Gallery — Kailo" },
      { property: "og:description", content: "Visual moments from the Kailo world." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

type Cat = "All" | "Products" | "Lifestyle" | "Events";
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

function Gallery() {
  const [cat, setCat] = useState<Cat>("All");
  const [open, setOpen] = useState<number | null>(null);
  const filtered = IMAGES.filter((i) => cat === "All" || i.cat === cat);

  return (
    <SiteLayout>
      <section className="bg-[var(--bg-soft)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Gallery</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Moments with Kailo</h1>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap gap-2">
            {(["All", "Products", "Lifestyle", "Events"] as Cat[]).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-primary/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setOpen(i)}
                className="block w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={img.src}
                  alt=""
                  loading="lazy"
                  className="w-full transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {open !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o! - 1 + filtered.length) % filtered.length);
            }}
            className="absolute left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <img
            src={filtered[open].src}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o! + 1) % filtered.length);
            }}
            className="absolute right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight />
          </button>
          <button
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X />
          </button>
        </div>
      )}
    </SiteLayout>
  );
}

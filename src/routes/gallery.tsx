import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

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
  { src: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80", cat: "Lifestyle" },
  { src: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80", cat: "Lifestyle" },
  { src: "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=900&q=80", cat: "Events" },
  { src: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80", cat: "Events" },
  { src: "https://images.unsplash.com/photo-1556379118-7034d926d258?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=900&q=80", cat: "Lifestyle" },
  { src: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=900&q=80", cat: "Products" },
  { src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80", cat: "Events" },
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

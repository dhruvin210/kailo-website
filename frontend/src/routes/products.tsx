import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown, PackageOpen, X } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import heroImg from "@/assets/lifestyle/ukulele-window.png";

type ProductSearch = { category?: string; q?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  // Both reads are awaited here so the grid is server-rendered with content, and
  // returned so the same data survives hydration without a second fetch.
  loader: async ({ context }) => {
    const [products, categories] = await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
    return { products, categories };
  },
  head: () => ({
    meta: [
      { title: "Shop — Kailo" },
      {
        name: "description",
        content:
          "Browse handmade leather ukulele bags and hand-stitched ukulele straps, designed for musicians.",
      },
      { property: "og:title", content: "Shop — Kailo" },
      { property: "og:description", content: "Premium instrument accessories." },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
  component: Products,
});

type Sort = "newest" | "price-asc" | "price-desc" | "popular";

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Products() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { products, categories } = Route.useLoaderData();

  // "All" is a UI-only pill and is deliberately not stored in the CMS; the rest of
  // the list comes from the Category collection so it cannot drift from the data.
  const pills = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories]);
  const isCategory = (value: string) => pills.includes(value);

  const [cat, setCat] = useState<string>(category && isCategory(category) ? category : "All");
  const [sort, setSort] = useState<Sort>("newest");

  // Keep the active category in sync when arriving via a category link
  // (e.g. from the footer) while already on this page.
  useEffect(() => {
    if (category && pills.includes(category)) setCat(category);
  }, [category, pills]);

  const query = (q ?? "").trim().toLowerCase();

  const items = useMemo(() => {
    let list = products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (query === "" || p.name.toLowerCase().includes(query)),
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "popular") list = [...list].sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [products, cat, sort, query]);

  const isFiltered = cat !== "All" || query !== "";

  const resetFilters = () => {
    setCat("All");
    // Drop any category/search coming from the URL so the reset actually sticks.
    if (category || q) navigate({ search: {}, replace: true });
  };

  return (
    <SiteLayout>
      {/* ───────────────────────── HERO ──────────────────────── */}
      <section className="relative flex h-[70vh] min-h-[520px] items-center overflow-hidden bg-black">
        {/* Full-bleed hero */}
        <img
          src={heroImg}
          alt="A Kailo ukulele resting by the window"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Legibility grade — dark on the left where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

        <motion.div {...reveal} className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Shop
            </p>
            <h1 className="text-4xl font-semibold md:text-6xl">All accessories</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              {/* Counted from the catalogue so the copy cannot drift from the CMS. */}
              {products.length} products, hand-picked. Filter by category or sort to find your fit.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────── FILTERS + GRID ─────────────────── */}
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[280px_1fr] lg:px-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filters
                </div>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {pills.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCat(c)}
                      aria-pressed={cat === c}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        cat === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-[var(--bg-soft)] text-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mt-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Sort by
                </p>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    aria-label="Sort products"
                    className="w-full appearance-none rounded-full border border-border bg-[var(--bg-soft)] px-4 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="popular">Most popular</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{items.length}</span>{" "}
                {items.length === 1 ? "product" : "products"}
                {cat !== "All" && (
                  <>
                    {" "}
                    in <span className="text-foreground">{cat}</span>
                  </>
                )}
              </p>
            </div>

            {items.length === 0 ? (
              <motion.div
                {...reveal}
                className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-[var(--bg-soft)] px-8 py-20 text-center"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <PackageOpen className="h-7 w-7" />
                </div>
                <p className="mt-6 text-xl font-semibold">No products match these filters</p>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Try choosing a different category, or clear your search.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-dark)]"
                >
                  Reset filters
                </button>
              </motion.div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.5,
                      delay: (i % 3) * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

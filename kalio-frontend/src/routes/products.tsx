import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown, PackageOpen, X } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, CATEGORIES, formatINR } from "@/lib/products";

type ProductSearch = { category?: string; q?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop — Kailo" },
      {
        name: "description",
        content:
          "Browse premium cases, straps, tuners, picks and care kits, designed for musicians.",
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

const MAX_PRICE = 30000;

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const isCategory = (value: string): value is (typeof CATEGORIES)[number] =>
  (CATEGORIES as readonly string[]).includes(value);

function Products() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>(
    category && isCategory(category) ? category : "All"
  );
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<Sort>("newest");

  // Keep the active category in sync when arriving via a category link
  // (e.g. from the footer) while already on this page.
  useEffect(() => {
    if (category && isCategory(category)) setCat(category);
  }, [category]);

  const query = (q ?? "").trim().toLowerCase();

  const items = useMemo(() => {
    let list = PRODUCTS.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        p.price <= maxPrice &&
        (query === "" || p.name.toLowerCase().includes(query))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "popular") list = [...list].sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [cat, maxPrice, sort, query]);

  const isFiltered = cat !== "All" || maxPrice < MAX_PRICE || query !== "";

  const resetFilters = () => {
    setCat("All");
    setMaxPrice(MAX_PRICE);
    // Drop any category/search coming from the URL so the reset actually sticks.
    if (category || q) navigate({ search: {}, replace: true });
  };

  return (
    <SiteLayout>
      {/* ───────────────────────── HEADER ──────────────────────── */}
      <section className="border-b border-border bg-[var(--bg-soft)] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Shop
            </p>
            <h1 className="text-4xl font-semibold md:text-5xl">
              All accessories
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Twelve products, hand-picked. Filter by category, price or sort to
              find your fit.
            </p>
          </motion.div>
        </div>
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
                  {CATEGORIES.map((c) => (
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

              {/* Price */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Max price
                  </p>
                  <span className="font-display text-sm font-semibold text-primary">
                    {formatINR(maxPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={MAX_PRICE}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum price"
                  className="w-full accent-[var(--primary)]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatINR(1000)}</span>
                  <span>{formatINR(MAX_PRICE)}</span>
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
                <span className="font-semibold text-foreground">
                  {items.length}
                </span>{" "}
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
                <p className="mt-6 text-xl font-semibold">
                  No products match these filters
                </p>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Try widening your price range or choosing a different
                  category.
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

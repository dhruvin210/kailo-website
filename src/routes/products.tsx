import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop — Kailo" },
      { name: "description", content: "Browse premium cases, straps, tuners, picks and care kits, designed for musicians." },
      { property: "og:title", content: "Shop — Kailo" },
      { property: "og:description", content: "Premium instrument accessories." },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
  component: Products,
});

type Sort = "newest" | "price-asc" | "price-desc" | "popular";

function Products() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [maxPrice, setMaxPrice] = useState(400);
  const [sort, setSort] = useState<Sort>("newest");

  const items = useMemo(() => {
    let list = PRODUCTS.filter((p) => (cat === "All" || p.category === cat) && p.price <= maxPrice);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "popular") list = [...list].sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [cat, maxPrice, sort]);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-[var(--bg-soft)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Shop</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">All accessories</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Twelve products, hand-picked. Filter by category, price or sort to find your fit.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <aside className="space-y-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Category
              </div>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                      cat === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 text-sm font-semibold">Price: up to ${maxPrice}</div>
              <input
                type="range"
                min={20}
                max={400}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <div className="mb-3 text-sm font-semibold">Sort</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most popular</option>
              </select>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
              <span>{items.length} products</span>
            </div>
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center">
                <p className="text-lg font-semibold">No products match these filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try widening your price range.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { formatINR, getProduct, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Product"} — Kailo` },
      { name: "description", content: loaderData?.product.description ?? "" },
      { property: "og:title", content: loaderData?.product.name ?? "Product" },
      { property: "og:description", content: loaderData?.product.description ?? "" },
      { property: "og:type", content: "product" },
      { property: "og:image", content: loaderData?.product.image ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl p-20 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-primary hover:underline">
          ← Back to shop
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl p-20 text-center">Something went wrong.</div>
    </SiteLayout>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="hover:text-primary">Products</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-3xl bg-muted">
              <img src={product.images[activeImg]} alt={product.name} className="aspect-square w-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                      activeImg === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{product.category}</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-primary" : ""}`} />
                ))}
              </div>
              <span className="text-muted-foreground">
                {product.rating} · {product.reviews} reviews
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold">{formatINR(product.price)}</p>
            <p className="mt-5 text-muted-foreground">{product.description}</p>

            <div className="mt-8 flex items-center gap-4">
              <div className="inline-flex items-center rounded-full border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5" aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2.5" aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  add(product.id, qty);
                  toast.success(`${product.name} added to cart`);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-dark)]"
              >
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </button>
              <button
                onClick={() => toast.success("Added to wishlist")}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground hover:text-primary"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-10">
              <div className="flex gap-6 border-b border-border text-sm">
                {[
                  { k: "desc", label: "Description" },
                  { k: "specs", label: "Specifications" },
                  { k: "reviews", label: "Reviews" },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k as typeof tab)}
                    className={`-mb-px border-b-2 px-1 py-3 font-medium transition-colors ${
                      tab === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="py-6 text-sm text-muted-foreground">
                {tab === "desc" && <p>{product.description}</p>}
                {tab === "specs" && (
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {product.specs.map((s: { label: string; value: string }) => (
                      <div key={s.label} className="rounded-lg bg-muted/50 px-4 py-3">
                        <dt className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</dt>
                        <dd className="mt-1 text-foreground">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {tab === "reviews" && (
                  <div className="space-y-4">
                    {[
                      { n: "Jordan B.", r: 5, t: "Exactly as described. Beautiful piece." },
                      { n: "Riley M.", r: 5, t: "Worth every penny. Built like a tank." },
                      { n: "Sage W.", r: 4, t: "Great quality, slightly slow shipping." },
                    ].map((rv, i) => (
                      <div key={i} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{rv.n}</span>
                          <div className="flex gap-0.5 text-primary">
                            {Array.from({ length: 5 }).map((_, k) => (
                              <Star key={k} className={`h-3.5 w-3.5 ${k < rv.r ? "fill-primary" : ""}`} />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2">{rv.t}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-2xl font-semibold">You may also like</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

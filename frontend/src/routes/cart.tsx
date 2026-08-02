import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart } from "@/lib/cart";
import { isCartToken } from "@/lib/cartSync";
import { formatINR } from "@/lib/products";
import { productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/cart")({
  /**
   * `?cart=<token>` opens a cart on a device that has never seen it. Validated to
   * the same shape the CMS accepts, and dropped when it is anything else — a junk
   * value in the URL should render the page, not break it.
   */
  validateSearch: (search: Record<string, unknown>): { cart?: string } =>
    isCartToken(search.cart) ? { cart: search.cart } : {},
  // The cart itself is localStorage, but turning its ids into line items needs the
  // catalogue — warm it here so arriving directly on /cart resolves in one hop.
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  head: () => ({
    meta: [
      { title: "Cart — Kailo" },
      { name: "description", content: "Review your Kailo cart and head to checkout." },
      { property: "og:url", content: "/cart" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { detailed, subtotal, update, remove, isResolving, count, adoptCart } = useCart();
  const { cart: linkedToken } = Route.useSearch();
  const shipping = subtotal > 5000 ? 0 : subtotal > 0 ? 199 : 0;

  /**
   * Adopt the cart behind a `?cart=` link, once.
   *
   * The ref rather than the effect's dependency list because `adoptCart` is
   * recreated whenever the token changes — and adopting *changes the token*, so
   * keying on it would re-run this immediately and fight itself.
   */
  const adopted = useRef<string | null>(null);

  useEffect(() => {
    if (!linkedToken || adopted.current === linkedToken) return;
    adopted.current = linkedToken;

    void adoptCart(linkedToken).then((added) => {
      if (added > 0) {
        toast.success(
          added === 1
            ? "We've restored 1 item to your cart."
            : `We've restored ${added} items to your cart.`,
        );
      }
    });
  }, [linkedToken, adoptCart]);

  return (
    <SiteLayout>
      <section className="bg-[var(--bg-soft)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold">Your cart</h1>
        </div>
      </section>
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isResolving ? (
            // The cart is read from localStorage after mount, so its line items are
            // always resolved client-side. Hold the layout instead of flashing the
            // empty state while the catalogue is in flight.
            <ul className="space-y-4" aria-busy="true" aria-label="Loading your cart">
              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <li
                  key={i}
                  className="flex animate-pulse items-center gap-4 rounded-2xl border border-border bg-white p-4"
                >
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 rounded bg-muted" />
                    <div className="h-3 w-1/5 rounded bg-muted" />
                    <div className="h-4 w-1/6 rounded bg-muted" />
                  </div>
                </li>
              ))}
            </ul>
          ) : detailed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center">
              <p className="text-lg font-semibold">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Find something you love.</p>
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-dark)]"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <ul className="space-y-4">
                {detailed.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <Link
                        to="/products/$id"
                        params={{ id: product.id }}
                        className="font-medium hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <p className="mt-2 font-semibold">{formatINR(product.price)}</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button
                        onClick={() => update(product.id, quantity - 1)}
                        className="px-3 py-2"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => update(product.id, quantity + 1)}
                        className="px-3 py-2"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(product.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <aside className="h-fit rounded-2xl border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>{formatINR(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                    <dt>Total</dt>
                    <dd>{formatINR(subtotal + shipping)}</dd>
                  </div>
                </dl>
                <input
                  placeholder="Discount code"
                  className="mt-5 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <Link
                  to="/checkout"
                  className="mt-4 inline-flex w-full justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-dark)]"
                >
                  Proceed to checkout
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

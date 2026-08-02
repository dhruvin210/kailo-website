import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProducts } from "./queries";
import { type Product } from "./products";
import {
  fetchCart,
  isCartToken,
  markCartRecovered,
  newCartToken,
  syncCart,
  type SyncedItem,
} from "./cartSync";

export type CartItem = { id: string; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  detailed: { product: Product; quantity: number }[];
  /**
   * True while the catalogue needed to turn stored ids into line items is still in
   * flight. `items` is already known at that point, so `count` is accurate — it is
   * only `detailed` and `subtotal` that are not yet.
   */
  isResolving: boolean;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;

  /* ── server mirror (additive; nothing above changed) ── */

  /**
   * This browser's cart id. Stable across reloads, and the only thing tying a
   * persisted cart to this visitor — there is no login. Empty until the provider
   * has read localStorage.
   */
  cartToken: string;
  /**
   * Adopts the cart behind a `?cart=<token>` link: merges its line items into
   * this one and takes over its token, so both sides converge on one row.
   * Resolves the number of lines added.
   */
  adoptCart: (token: string) => Promise<number>;
  /**
   * The future checkout's hook — marks this cart recovered. Nothing calls it yet;
   * see `markCartRecovered` in `cartSync.ts` for why.
   */
  markRecovered: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

const KEY = "kailo-cart";
/** A separate key, so the cart's stored format is untouched by any of this. */
const TOKEN_KEY = "kailo-cart-token";

/**
 * How long the cart must sit still before it is mirrored to the CMS.
 *
 * Long enough that holding the `+` button to reach quantity 10 is one request
 * rather than ten, short enough that closing the tab a moment after the last
 * change still saves it.
 */
const SYNC_DEBOUNCE_MS = 1500;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartToken, setCartToken] = useState("");

  /**
   * Whether localStorage has been read yet.
   *
   * Load-bearing for the sync: before this flips, `items` is `[]` because nothing
   * has been restored — not because the cart is empty. Mirroring that would
   * overwrite a perfectly good server-side cart with nothing on every page load.
   */
  const [hydrated, setHydrated] = useState(false);

  // The cart stores ids and quantities only; names, prices and images are resolved
  // against the live catalogue. Nothing is fetched until there is a cart to resolve,
  // so the provider stays free on pages that never touch it.
  const { data: products, isPending } = useProducts({ enabled: items.length > 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        // Guard against corrupted/legacy values — a non-array here would crash
        // the reducers below (.reduce / .map) on render.
        if (
          Array.isArray(parsed) &&
          parsed.every((i) => i && typeof i.id === "string" && typeof i.quantity === "number")
        ) {
          setItems(parsed);
        }
      }

      // Minted on first visit and kept forever after. Reusing it is the point:
      // a returning shopper updates their existing row rather than littering the
      // CMS with one abandoned cart per session.
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const token = isCartToken(storedToken) ? storedToken : newCartToken();

      if (token !== storedToken) localStorage.setItem(TOKEN_KEY, token);
      setCartToken(token);
    } catch {
      // Private-browsing localStorage throws on write. The cart still works for
      // the session; it just will not be remembered or mirrored.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Quota or private-browsing failure. The in-memory cart is the source of
      // truth for this session, so a failed mirror is not worth surfacing.
    }
  }, [items, hydrated]);

  const detailed = useMemo(() => {
    const catalogue = products ?? [];

    return (
      items
        // A stored id that no longer exists in the catalogue (unpublished, renamed
        // slug) is skipped rather than rendered half-empty.
        .map((i) => {
          const product = catalogue.find((p) => p.id === i.id);
          return product ? { product, quantity: i.quantity } : null;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  }, [items, products]);

  const subtotal = useMemo(
    () => detailed.reduce((s, d) => s + d.product.price * d.quantity, 0),
    [detailed],
  );

  const isResolving = items.length > 0 && isPending;

  /**
   * The line items as the CMS stores them: denormalised, so the stored row shows
   * what the shopper saw even after the product is repriced or unpublished.
   *
   * `Product.id` *is* the slug (see `products.ts`), which is what lets a `?cart=`
   * link map straight back onto local cart entries.
   */
  const syncedItems = useMemo<SyncedItem[]>(
    () =>
      detailed.map(({ product, quantity }) => ({
        slug: product.id,
        name: product.name,
        qty: quantity,
        price: product.price,
        image: product.image,
      })),
    [detailed],
  );

  /**
   * Mirrors the cart to the CMS, debounced.
   *
   * Three guards, each preventing a specific way of writing a lie:
   *
   *  • not before hydration — `[]` would mean "nothing restored yet", not "empty";
   *  • not while the catalogue is resolving — `detailed` is empty until it lands,
   *    so an in-flight page load would report an empty cart;
   *  • not before a token exists.
   *
   * An empty cart *after* all three is real and is mirrored: a shopper who removed
   * their last item should have that reflected in the row.
   */
  useEffect(() => {
    if (!hydrated || !cartToken || isResolving) return;

    const timer = setTimeout(() => {
      void syncCart(cartToken, { items: syncedItems, subtotal });
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [hydrated, cartToken, isResolving, syncedItems, subtotal]);

  const adoptCart = useCallback(
    async (token: string): Promise<number> => {
      if (!isCartToken(token) || token === cartToken) return 0;

      const remote = await fetchCart(token);
      if (!remote) return 0;

      // Adopt the token as well as the contents. Without this the browser keeps
      // mirroring to its own row and the row the link pointed at is never updated,
      // so the two would drift apart from here on.
      setCartToken(token);
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // The adopted token is held in state for this session either way; only
        // its persistence across reloads is lost.
      }

      let added = 0;

      setItems((prev) => {
        // Fresh objects, not a shallow copy of the array: mutating an entry in
        // place would edit the current state object and the change could be missed.
        const merged = prev.map((i) => ({ ...i }));

        for (const line of remote.items) {
          if (!line?.slug || typeof line.qty !== "number" || line.qty < 1) continue;

          const existing = merged.find((i) => i.id === line.slug);

          if (existing) {
            // The higher of the two, not the sum: this is the same cart seen from
            // two devices, and adding them together would silently double an order.
            existing.quantity = Math.max(existing.quantity, line.qty);
          } else {
            merged.push({ id: line.slug, quantity: line.qty });
            added += 1;
          }
        }

        return merged;
      });

      return added;
    },
    [cartToken],
  );

  const markRecovered = useCallback(
    () => (cartToken ? markCartRecovered(cartToken) : Promise.resolve(false)),
    [cartToken],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      detailed,
      isResolving,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      add: (id, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === id);
          if (found)
            return prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + qty } : p));
          return [...prev, { id, quantity: qty }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      update: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
        ),
      clear: () => setItems([]),

      cartToken,
      adoptCart,
      markRecovered,
    }),
    [items, detailed, isResolving, subtotal, cartToken, adoptCart, markRecovered],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

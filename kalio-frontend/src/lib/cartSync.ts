/**
 * The cart's server side: mirroring it to Strapi so a `?cart=<token>` link can
 * rehydrate it on a device that has never seen it.
 *
 * The cart itself stays exactly where it was — localStorage, resolved against the
 * live catalogue. This is a *mirror*, not a move. Nothing on the page reads back
 * from the CMS during normal use, so a CMS that is down, slow or misconfigured
 * costs the shopper nothing: `syncCart` swallows its failures and the cart keeps
 * working offline.
 *
 * Two things it is not:
 *
 *  • **Not a session.** There is no login. A `cartToken` is a random id this
 *    browser generated and kept in localStorage, and it is the only thing tying a
 *    row to a browser. Treat it as a bearer secret — it travels in the `?cart=`
 *    link.
 *  • **Not the source of truth for money.** The server recomputes `subtotal` from
 *    the line items it stores, so what is sent here is a courtesy. Prices and
 *    names *are* sent, because the stored row should show what the shopper saw
 *    even after the product is repriced or unpublished.
 */

import { CMS_IS_STATIC, STRAPI_URL } from "./strapi";

/** One line item, in the shape the CMS stores. */
export type SyncedItem = {
  slug: string;
  name: string;
  qty: number;
  price: number;
  image: string;
};

/** What `GET /carts/token/:token` returns. */
export type RemoteCart = {
  cartToken: string;
  items: SyncedItem[];
  subtotal: number;
  status: "active" | "recovered";
};

/**
 * A fresh cart token.
 *
 * `randomUUID` needs a secure context, which `localhost` and any real deployment
 * both are — but a LAN address over plain http is neither, and there the API is
 * simply absent. The fallback is not cryptographically equivalent; it only has to
 * avoid collisions between a handful of browsers, since a token is never a
 * credential for anything but its own cart.
 */
export const newCartToken = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const random = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0"),
  ).join("");

  return `${Date.now().toString(36)}-${random}`;
};

/** Matches the backend's `CART_TOKEN` guard, so a bad token fails here not there. */
export const isCartToken = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);

type SyncPayload = {
  items: SyncedItem[];
  subtotal: number;
};

/**
 * Mirrors the cart to `PUT /api/carts/token/:cartToken`, creating the row on first
 * call and updating it after.
 *
 * Resolves `true` on success and `false` on any failure — network, CORS, 429, a
 * CMS that has never heard of carts. Callers use it for logging at most; there is
 * deliberately nothing for the shopper to see or retry, because as far as they are
 * concerned the cart is already saved.
 */
export async function syncCart(
  cartToken: string,
  { items, subtotal }: SyncPayload,
): Promise<boolean> {
  if (CMS_IS_STATIC || !isCartToken(cartToken)) return false;

  try {
    const res = await fetch(`${STRAPI_URL}/api/carts/token/${encodeURIComponent(cartToken)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { items, subtotal } }),
      // The cart is not worth holding a tab's connection open for.
      keepalive: true,
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Reads the cart behind a `?cart=<token>` link.
 *
 * `null` for anything other than a hit: an unknown or stale token, a malformed
 * one, or an unreachable CMS. The caller cannot act differently on those, and the
 * shopper must not see an error for following a link to a cart they still have
 * locally anyway.
 */
export async function fetchCart(cartToken: string): Promise<RemoteCart | null> {
  if (CMS_IS_STATIC || !isCartToken(cartToken)) return null;

  try {
    const res = await fetch(`${STRAPI_URL}/api/carts/token/${encodeURIComponent(cartToken)}`);
    if (!res.ok) return null;

    const body = (await res.json()) as { data?: RemoteCart };
    const cart = body.data;

    if (!cart || !Array.isArray(cart.items)) return null;

    return cart;
  } catch {
    return null;
  }
}

/**
 * Marks a cart recovered: `POST /api/carts/token/:token/recovered`. Idempotent.
 *
 * **Nothing calls this yet, and that is not an oversight.** Recovery cannot be
 * inferred from the storefront as it stands — a cart going quiet looks identical
 * whether they checked out, bought elsewhere, or lost interest, and clearing the
 * cart is not evidence either (the "empty your cart" button and a completed order
 * are the same event to this code).
 *
 * When a checkout exists, its success page is the one honest caller: hand it the
 * token that was just converted and the row is marked terminally.
 */
export async function markCartRecovered(cartToken: string): Promise<boolean> {
  if (CMS_IS_STATIC || !isCartToken(cartToken)) return false;

  try {
    const res = await fetch(
      `${STRAPI_URL}/api/carts/token/${encodeURIComponent(cartToken)}/recovered`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );

    return res.ok;
  } catch {
    return false;
  }
}

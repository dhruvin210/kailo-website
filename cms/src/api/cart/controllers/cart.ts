/**
 * The public, token-scoped cart API.
 *
 * There is no login and no checkout, so a cart is identified by nothing but the
 * `cartToken` the browser generated and kept in localStorage. That shapes every
 * decision here:
 *
 * **The token is a bearer secret.** Whoever holds it can read and write that
 * cart. It is a v4 UUID, so it is not guessable — but it does travel in the
 * `?cart=` link the shopper can carry to another device, which means it can end
 * up in a browser history or a forwarded message. So `findByToken` returns line
 * items, subtotal and status and nothing else: a leaked link exposes a shopping
 * list, and there is nothing personal in the row to expose alongside it.
 *
 * **The client is not trusted with anything derived.** `subtotal` is recomputed
 * from the line items, `lastActivityAt` is stamped from the server clock, and
 * `status`/`recoveredAt` are not writable from a request body at all. The
 * whitelist in `pickWritable` is the whole contract.
 *
 * **There is no `find` and no `delete`.** Not "permission denied" — the routes do
 * not exist (see `routes/cart.ts`), so there is no way to enumerate carts or
 * destroy one, and no permission checkbox anybody can tick by accident.
 *
 * What is *not* defended: an attacker can still mint rows by PUTing random
 * tokens. `src/middlewares/public-form-guard.ts` throttles that per IP, which is
 * the most that is available without auth.
 */
import { factories } from '@strapi/strapi';

const UID = 'api::cart.cart' as const;

/** UUIDs and any other opaque id, but nothing that could be a path or a wildcard. */
const CART_TOKEN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Ceilings on what one request may store. A cart is a JSON column with no schema
 * of its own, so these are what stop it becoming an arbitrary blob store.
 */
const MAX_ITEMS = 100;
const MAX_QTY = 999;
const MAX_PRICE = 10_000_000;
const MAX_TEXT = 200;
const MAX_URL = 500;

/** One line item as it is stored: enough to render the cart without the catalogue. */
type StoredItem = {
  slug: string;
  name: string;
  qty: number;
  price: number;
  image: string | null;
};

const asTrimmedString = (value: unknown, maxChars = MAX_TEXT): string =>
  (typeof value === 'string' ? value.trim() : '').slice(0, maxChars);

/** Non-negative integer, clamped. Anything unparseable becomes `fallback`. */
const asInt = (value: unknown, max: number, fallback = 0): number => {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
};

/**
 * Only `http(s)` is useful for a stored thumbnail — and a `data:` or
 * `javascript:` value has no business in the column.
 */
const asImageUrl = (value: unknown): string | null => {
  const url = asTrimmedString(value, MAX_URL);
  return /^https?:\/\//i.test(url) ? url : null;
};

/**
 * The line items, sanitised.
 *
 * Prices and names are denormalised from the client rather than looked up: the
 * stored row should show what the shopper actually saw, and must still render
 * after the product is unpublished or repriced. The cost is that both are
 * client-supplied — which is exactly why the subtotal is recomputed from them
 * rather than taken on trust, so the row cannot contradict its own arithmetic.
 *
 * Anything without a slug and a name is dropped rather than stored half-empty.
 */
const sanitiseItems = (value: unknown): StoredItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_ITEMS)
    .map((raw): StoredItem | null => {
      if (!raw || typeof raw !== 'object') return null;

      const item = raw as Record<string, unknown>;
      const slug = asTrimmedString(item.slug);
      const name = asTrimmedString(item.name);
      const qty = asInt(item.qty, MAX_QTY, 0);

      if (slug === '' || name === '' || qty < 1) return null;

      return { slug, name, qty, price: asInt(item.price, MAX_PRICE), image: asImageUrl(item.image) };
    })
    .filter((item): item is StoredItem => item !== null);
};

const subtotalOf = (items: StoredItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

/**
 * A sanitised patch, ready for the document service.
 *
 * Strapi's generated input types do not model every column this touches, so
 * every call site casts this once, with the cast confined to that single line.
 */
type CartPatch = Record<string, unknown>;

/**
 * The write whitelist: the only fields a request body can influence, and what
 * they become.
 *
 * **Patch semantics, not replace.** A key absent from the body is absent from the
 * patch, so it keeps its stored value.
 *
 * `lastActivityAt` is not readable from the body at all, even though it is always
 * written: a device clock wrong by hours would put a cart's last-seen time in the
 * future or the distant past. Server clock only.
 *
 * `subtotal` is derived, never accepted: it is recomputed from the line items so
 * the stored row cannot contradict its own arithmetic.
 */
const pickWritable = (body: Record<string, unknown>): CartPatch => {
  const patch: CartPatch = { lastActivityAt: new Date() };

  if ('items' in body) {
    const items = sanitiseItems(body.items);
    patch.items = items;
    patch.subtotal = subtotalOf(items);
  }

  return patch;
};

/** The stored row, as far as `publicView` needs to care. */
type CartRowish = {
  cartToken?: string | null;
  items?: unknown;
  subtotal?: number | null;
  status?: string | null;
};

/** Everything a `?cart=` link needs to rehydrate. */
const publicView = (cart: CartRowish) => ({
  cartToken: cart.cartToken ?? '',
  items: Array.isArray(cart.items) ? cart.items : [],
  subtotal: cart.subtotal ?? 0,
  status: cart.status ?? 'active',
});

export default factories.createCoreController(UID, ({ strapi }) => ({
  /**
   * `PUT /api/carts/token/:cartToken` — create or update, idempotently.
   *
   * One endpoint rather than create + update because the client does not know
   * (and should not have to track) whether this token has been synced before.
   *
   * A `recovered` cart is never revived by a write: that state means the shopper
   * converted, and only `markRecovered` writes it.
   */
  async upsertByToken(ctx) {
    const { cartToken } = ctx.params as { cartToken?: string };

    if (!cartToken || !CART_TOKEN.test(cartToken)) {
      return ctx.badRequest('Invalid cart token.');
    }

    const body = (ctx.request.body as { data?: Record<string, unknown> })?.data ?? {};
    const writable = pickWritable(body);

    const existing = await strapi.db.query(UID).findOne({ where: { cartToken } });

    /** How much of the cart this request actually carried, for the log line. */
    const touched = Array.isArray(writable.items)
      ? `${writable.items.length} line(s), ${writable.subtotal}`
      : 'no line items';

    if (!existing) {
      const created = await strapi.documents(UID).create({
        // The cast is the `CartPatch` one — see the type's doc comment.
        data: { cartToken, ...writable, status: 'active' } as any,
      });

      strapi.log.debug(`[cart] created ${cartToken} — ${touched}`);

      ctx.status = 201;
      ctx.body = { data: publicView(created), meta: {} };
      return;
    }

    // Derived from the *fact* of the write, never from what the client asked for —
    // `status` is not in the whitelist. `recovered` is terminal.
    const status = existing.status === 'recovered' ? 'recovered' : 'active';

    const updated = await strapi.documents(UID).update({
      documentId: existing.documentId,
      data: { ...writable, status } as any,
    });

    // Null when the row disappeared between the lookup and the write — an admin
    // deleting it mid-sync. Nothing was stored, so don't answer as though it was.
    if (!updated) return ctx.notFound('No cart for that token.');

    strapi.log.debug(`[cart] updated ${cartToken} — ${touched}`);

    ctx.body = { data: publicView(updated), meta: {} };
  },

  /**
   * `GET /api/carts/token/:cartToken` — the cart behind a `?cart=` link.
   *
   * Answers 404 for an unknown token rather than an empty cart, so the frontend
   * can tell "this link is stale" from "your cart is empty".
   */
  async findByToken(ctx) {
    const { cartToken } = ctx.params as { cartToken?: string };

    if (!cartToken || !CART_TOKEN.test(cartToken)) {
      return ctx.badRequest('Invalid cart token.');
    }

    const cart = await strapi.db.query(UID).findOne({ where: { cartToken } });

    if (!cart) return ctx.notFound('No cart for that token.');

    ctx.body = { data: publicView(cart), meta: {} };
  },

  /**
   * `POST /api/carts/token/:cartToken/recovered` — the future checkout's hook.
   *
   * **Nothing calls this yet.** Recovery cannot be detected without an order: a
   * cart going quiet looks identical whether they bought elsewhere, bought here,
   * or lost interest. When a checkout exists, its success page calls this with
   * the token it just converted, and the row is marked terminally.
   *
   * Idempotent: calling it on an already-recovered cart is a 200 with the
   * original `recoveredAt`, so a checkout page that double-fires is harmless.
   */
  async markRecovered(ctx) {
    const { cartToken } = ctx.params as { cartToken?: string };

    if (!cartToken || !CART_TOKEN.test(cartToken)) {
      return ctx.badRequest('Invalid cart token.');
    }

    const cart = await strapi.db.query(UID).findOne({ where: { cartToken } });

    if (!cart) return ctx.notFound('No cart for that token.');

    if (cart.status === 'recovered') {
      ctx.body = { data: { status: 'recovered', recoveredAt: cart.recoveredAt }, meta: {} };
      return;
    }

    const recoveredAt = new Date();

    await strapi.documents(UID).update({
      documentId: cart.documentId,
      data: { status: 'recovered', recoveredAt } as any,
    });

    strapi.log.info(`[cart] ${cartToken} marked recovered`);

    ctx.body = { data: { status: 'recovered', recoveredAt }, meta: {} };
  },
}));

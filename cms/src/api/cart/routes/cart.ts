/**
 * Cart routes — a hand-written router, **not** `createCoreRouter`.
 *
 * That is the load-bearing decision in this file. A core router would generate
 * `find`, `findOne`, `create`, `update` and `delete` on `/api/carts`, and each
 * would appear in Settings → Roles → Public as a checkbox. Two of those —
 * "list every cart in the database" and "delete arbitrary carts" — are one
 * mis-click from being public, and there is no auth layer behind them to catch
 * it.
 *
 * So they are not declared. Only these three routes exist, every one of them
 * scoped to a `cartToken` the caller must already hold, and the corresponding
 * permission actions are the only ones Strapi registers for this content type.
 * Enumerating carts over the API is not denied, it is unimplemented.
 *
 * The three that do exist are still permission-checked rather than `auth: false`,
 * so they stay visible in the admin's Public-role screen — and they are granted
 * in `src/seed/permissions.ts` on every boot, keeping the API surface defined in
 * code rather than in whoever-clicked-what.
 *
 * The admin panel is unaffected either way: the content manager talks to its own
 * routes and lists these rows regardless of what the content API exposes.
 */
export default {
  routes: [
    {
      // Create-or-update. Idempotent, so the debounced client sync can repeat it.
      method: 'PUT',
      path: '/carts/token/:cartToken',
      handler: 'cart.upsertByToken',
    },
    {
      // Rehydrating a `?cart=<token>` link on another device. Returns line items
      // and totals only.
      method: 'GET',
      path: '/carts/token/:cartToken',
      handler: 'cart.findByToken',
    },
    {
      // The future checkout's hook. Nothing calls it yet — see the controller.
      method: 'POST',
      path: '/carts/token/:cartToken/recovered',
      handler: 'cart.markRecovered',
    },
  ],
};

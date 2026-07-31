/**
 * The baked-in CMS, for deploying the storefront without one.
 *
 * `scripts/snapshot-cms.mjs` writes the `.json` files beside this one: raw
 * `{ data, meta }` envelopes, byte-for-byte what Strapi answered. `strapi.ts`
 * reads them through `resolveSnapshot` whenever VITE_STRAPI_URL is unset, so the
 * unwrapping, the types and every caller stay exactly as they are for a live CMS.
 *
 * Media resolves the same way. The payloads carry root-relative upload URLs
 * (`/uploads/foo.png`) and the snapshot script copies those files into `public/`,
 * so with an empty STRAPI_URL the site's own origin serves them.
 *
 * **This is a point-in-time copy.** Editors changing content in Strapi will not
 * see it here until someone re-runs the script and redeploys. It exists to get
 * the storefront live before the CMS is hosted, and setting VITE_STRAPI_URL
 * retires it without touching any of this code.
 */

import aboutPage from "./about-page.json";
import categories from "./categories.json";
import contactPage from "./contact-page.json";
import galleryImages from "./gallery-images.json";
import global from "./global.json";
import homePage from "./home-page.json";
import products from "./products.json";

type Envelope = {
  data: unknown;
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

/** Keyed by pathname only; the query string is applied separately below. */
const BY_PATH: Record<string, Envelope> = {
  "/global": global,
  "/categories": categories,
  "/products": products,
  "/gallery-images": galleryImages,
  "/home-page": homePage,
  "/about-page": aboutPage,
  "/contact-page": contactPage,
};

/**
 * The one filter the storefront actually sends: `productBySlugQuery` reads a
 * single product as a filtered collection, because Strapi 5 addresses entries by
 * `documentId` and cannot `findOne` by slug.
 *
 * Sorting and pagination are deliberately *not* reimplemented — the snapshot was
 * captured with the same sort and page size the app requests, so the stored order
 * is already the right one.
 */
const SLUG_FILTER = "filters[slug][$eq]";

/**
 * The snapshot for a `queries.ts` path, or `undefined` if nothing was captured
 * for it — which the caller turns into the same error a 404 would produce.
 */
export const resolveSnapshot = (requestPath: string): Envelope | undefined => {
  const [pathname, search] = requestPath.split("?");
  const envelope = BY_PATH[pathname];

  if (!envelope) return undefined;

  const slug = search ? new URLSearchParams(search).get(SLUG_FILTER) : null;

  if (slug !== null && Array.isArray(envelope.data)) {
    const matches = (envelope.data as { slug?: string }[]).filter((e) => e.slug === slug);
    return { ...envelope, data: matches };
  }

  return envelope;
};

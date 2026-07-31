/**
 * Strapi entities → the shapes the components already speak.
 *
 * The point of this file is that nothing downstream has to know the CMS exists.
 * `toProduct` returns the same `Product` the hardcoded catalogue used to export,
 * so `ProductCard`, the cart, and the product routes are untouched by the switch;
 * `toGalleryImage` matches the `{ src, cat }` items the gallery grid filters on.
 */

import { mediaAlt, mediaSrcSet, mediaUrl, type StrapiMedia, type StrapiSeo } from "./strapi";
import type { Product } from "./products";

/* ─────────────────────────── entity payloads ─────────────────────────── */

export type StrapiCategory = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  tagline: string | null;
  order: number | null;
};

export type StrapiSpec = { label: string; value: string };

export type StrapiProduct = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  category: StrapiCategory | null;
  price: number;
  rating: number | null;
  reviews: number | null;
  mainImage: StrapiMedia | null;
  gallery: StrapiMedia[] | null;
  /** Set only when the seed could not download a remote original. */
  remoteImageUrl: string | null;
  remoteGalleryUrls: string[] | null;
  description: string;
  specs: StrapiSpec[] | null;
  badge: "NEW" | "SALE" | null;
  stock: number;
  seo?: StrapiSeo;
};

export type StrapiGalleryImage = {
  id: number;
  documentId: string;
  image: StrapiMedia | null;
  category: "Products" | "Lifestyle" | "Events";
  alt: string | null;
  caption: string | null;
  order: number | null;
};

/* ──────────────────────────────── product ────────────────────────────── */

/**
 * The `Product.category` union is a closed set of the six seeded category names.
 * A category renamed in the CMS still flows through — it simply won't match a
 * filter pill until the pill list is refetched, which it is on every visit.
 */
const asProductCategory = (name: string | undefined): Product["category"] =>
  (name ?? "Tenor Size Bags") as Product["category"];

/** First non-empty candidate, or `""` — safe to drop straight into `src`. */
const firstUrl = (...candidates: (string | null | undefined)[]): string =>
  candidates.find((candidate): candidate is string => !!candidate && candidate.length > 0) ?? "";

export function toProduct(entity: StrapiProduct): Product {
  const galleryUrls = (entity.gallery ?? []).map((media) => mediaUrl(media)).filter(Boolean);

  // Uploads first, then the remote original the seed fell back to.
  const image = firstUrl(
    mediaUrl(entity.mainImage),
    galleryUrls[0],
    entity.remoteImageUrl,
    entity.remoteGalleryUrls?.[0],
  );

  const remoteGallery = (entity.remoteGalleryUrls ?? []).filter(Boolean);
  const usingGallery = galleryUrls.length > 0;
  const images = usingGallery
    ? galleryUrls
    : remoteGallery.length > 0
      ? remoteGallery
      : image
        ? [image]
        : [];

  // Only uploads carry derivatives; a remote fallback URL is a single fixed size.
  const mainSrcSet =
    mediaSrcSet(entity.mainImage) ?? (usingGallery ? mediaSrcSet(entity.gallery?.[0]) : undefined);
  const gallerySrcSet = usingGallery
    ? (entity.gallery ?? []).map((media) => mediaSrcSet(media))
    : undefined;

  return {
    // The slug is the id everywhere in this app: route params, cart entries,
    // wishlist entries. Strapi's own documentId is deliberately not exposed.
    id: entity.slug,
    name: entity.name,
    category: asProductCategory(entity.category?.name),
    price: entity.price,
    rating: entity.rating ?? 0,
    reviews: entity.reviews ?? 0,
    image,
    images,
    ...(mainSrcSet ? { imageSrcSet: mainSrcSet } : {}),
    ...(gallerySrcSet?.some(Boolean) ? { imagesSrcSet: gallerySrcSet } : {}),
    description: entity.description,
    specs: (entity.specs ?? []).map(({ label, value }) => ({ label, value })),
    // The type models "no badge" as absent, the CMS as null.
    ...(entity.badge ? { badge: entity.badge } : {}),
    stock: entity.stock,
  };
}

/* ──────────────────────────────── gallery ────────────────────────────── */

export type GalleryImage = {
  src: string;
  /** Candidates for the masonry grid; the lightbox deliberately uses `src`. */
  srcSet?: string;
  cat: StrapiGalleryImage["category"];
  alt: string;
  caption: string | null;
  order: number;
};

export function toGalleryImage(entity: StrapiGalleryImage): GalleryImage {
  return {
    src: mediaUrl(entity.image),
    srcSet: mediaSrcSet(entity.image),
    cat: entity.category,
    // Real alt text on the record, falling back to the upload's own and finally
    // to the template string the page used before the CMS.
    alt:
      entity.alt?.trim() ||
      mediaAlt(entity.image) ||
      `Kailo ${entity.category.toLowerCase()} moment`,
    caption: entity.caption,
    order: entity.order ?? 0,
  };
}

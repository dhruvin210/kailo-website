/**
 * The catalogue's shape and its money formatting.
 *
 * The products themselves now come from Strapi — see `queries.ts` for the reads and
 * `normalize.ts` for the mapping. This type is deliberately unchanged from when the
 * catalogue was a hardcoded array, so every consumer (`ProductCard`, the cart, the
 * product routes) was untouched by that switch.
 */

export type Product = {
  /**
   * The product's slug. It is the id used by the `/products/$id` route, the cart's
   * localStorage entries and the wishlist's — never Strapi's `documentId`.
   */
  id: string;
  name: string;
  /**
   * A category name from the CMS. One flat level: bags are filed by size, straps
   * by material, and the name doubles as the shop's filter pill.
   */
  category:
    | "Tenor Size Bags"
    | "Concert Size Bags"
    | "Denim"
    | "Suede Leather"
    | "NDM Leather"
    | "Ukuleles";
  /** Whole rupees. Format with `formatINR`; never divide. */
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  /**
   * `srcSet` candidates for `image` / each entry of `images`, when the CMS holds
   * more than one size. Additive and optional — a consumer that ignores them still
   * renders correctly from `image` alone.
   */
  imageSrcSet?: string;
  imagesSrcSet?: (string | undefined)[];
  description: string;
  specs: { label: string; value: string }[];
  badge?: "NEW" | "SALE";
  stock: number;
};

export const formatINR = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

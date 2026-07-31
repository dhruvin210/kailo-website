/**
 * TanStack Query options for every CMS read, plus the page payload types.
 *
 * **Why routes return loader data instead of calling `useSuspenseQuery`.**
 * This app has no query-cache dehydration between the SSR render and the client
 * (`@tanstack/react-router-ssr-query` is not installed, and §10 rules out adding a
 * data layer). A `useSuspenseQuery` in a server-rendered component would therefore
 * find a warm cache on the server and an empty one at hydration, suspend, and
 * mismatch. Router *loader data*, on the other hand, is serialised into the HTML
 * for free. So the pattern here is:
 *
 *     loader: async ({ context }) => ({
 *       home: await context.queryClient.ensureQueryData(homePageQuery()),
 *     })
 *
 * `ensureQueryData` still gives client-side navigations a warm, deduped cache; the
 * component reads `Route.useLoaderData()`, which is identical on both sides of
 * hydration. The `use*` hooks below are for the genuinely client-only consumers
 * (the cart, which resolves ids out of localStorage after mount).
 *
 * **No `populate` is passed.** `kalio-backend/src/middlewares/default-populate.ts`
 * fills in a full per-endpoint populate whenever the query omits one, and the
 * per-endpoint specs there are the single source of truth for what a page needs.
 * Pagination *is* passed explicitly: the REST default page size is 25 and the
 * gallery holds 30 images.
 */

import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  strapiFetch,
  strapiFetchList,
  type StrapiCta,
  type StrapiFeature,
  type StrapiMedia,
  type StrapiNavLink,
  type StrapiSeo,
} from "./strapi";
import {
  toGalleryImage,
  toProduct,
  type GalleryImage,
  type StrapiCategory,
  type StrapiGalleryImage,
  type StrapiProduct,
} from "./normalize";
import type { Product } from "./products";

/** CMS content changes on an editor's timescale, not a visitor's. */
const STALE_TIME = 5 * 60 * 1000;

const PAGE_SIZE = "pagination[pageSize]=100";

/* ────────────────────────── page payload types ────────────────────────── */

export type HeroSlide = {
  image: StrapiMedia | null;
  alt: string;
  position: string | null;
};

export type HeroStat = { value: string; label: string };

export type CategoryTile = {
  name: string;
  tagline: string;
  image: StrapiMedia | null;
  href: string | null;
  categoryFilter: string | null;
  position: string | null;
  feature: boolean;
  /** Renders a "Coming soon" pill; the tile still links through to its listing. */
  comingSoon: boolean;
};

export type GalleryTile = {
  image: StrapiMedia | null;
  alt: string;
  tall: boolean;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  location: string | null;
  initials: string | null;
  rating: number;
};

export type HomePage = {
  seo: StrapiSeo;

  heroEyebrow: string | null;
  heroHeadingLine1: string | null;
  heroHeadingLine2: string | null;
  heroSubtext: string | null;
  heroPrimaryCtaLabel: string | null;
  heroPrimaryCtaHref: string | null;
  heroSecondaryCtaLabel: string | null;
  heroSecondaryCtaHref: string | null;
  heroSlides: HeroSlide[] | null;
  heroStats: HeroStat[] | null;

  storyEyebrow: string | null;
  storyHeading: string | null;
  storyBody: string | null;
  storyBodySecondary: string | null;
  storyChips: string[] | null;
  storyStatValue: string | null;
  storyStatLabel: string | null;
  storyImage: StrapiMedia | null;
  storyInsetImage: StrapiMedia | null;
  storyCtaLabel: string | null;
  storyCtaHref: string | null;

  categoriesEyebrow: string | null;
  categoriesHeading: string | null;
  categoryTiles: CategoryTile[] | null;

  galleryEyebrow: string | null;
  galleryHeading: string | null;
  galleryDescription: string | null;
  homeGallery: GalleryTile[] | null;

  /** Modelled and seeded, but the "Why Kailo" band is not in the current design. */
  whyEyebrow: string | null;
  whyHeading: string | null;
  features: StrapiFeature[] | null;

  bestSellersEyebrow: string | null;
  bestSellersHeading: string | null;
  bestSellersDescription: string | null;
  bestSellers: StrapiProduct[] | null;

  testimonialsEyebrow: string | null;
  testimonialsHeading: string | null;
  testimonialsDescription: string | null;
  testimonials: Testimonial[] | null;

  /** Seeded; there is no newsletter section in the current design. */
  newsletter: StrapiCta;
};

export type AboutValue = StrapiFeature;

export type Material = {
  name: string;
  meta: string | null;
  body: string;
  image: StrapiMedia | null;
};

export type AboutPage = {
  seo: StrapiSeo;

  heroEyebrow: string | null;
  heroHeadingLine1: string | null;
  heroHeadingLine2: string | null;
  heroSubtext: string | null;
  heroImage: StrapiMedia | null;

  storyEyebrow: string | null;
  storyHeading: string | null;
  /** The opening paragraph, set full width in lead style. */
  storyLead: string | null;
  /** One string per paragraph of the column that follows the lead. */
  storyParagraphs: string[] | null;
  /** An exact quote from the copy above, lifted out to break the column. */
  storyPullQuote: string | null;
  storyChips: string[] | null;
  storyImage: StrapiMedia | null;
  storyStatValue: string | null;
  storyStatLabel: string | null;

  materialsEyebrow: string | null;
  materialsHeading: string | null;
  materialsDescription: string | null;
  materials: Material[] | null;

  craftEyebrow: string | null;
  craftHeading: string | null;
  craftDescription: string | null;
  craftImage: StrapiMedia | null;
  craftDetails: StrapiFeature[] | null;

  valuesEyebrow: string | null;
  valuesHeading: string | null;
  values: AboutValue[] | null;

  audienceEyebrow: string | null;
  audienceHeading: string | null;
  audienceDescription: string | null;
  audiences: StrapiFeature[] | null;

  cta: StrapiCta;
};

export type ContactDetail = { icon: string; label: string; value: string };
export type Faq = { question: string; answer: string };

export type ContactPage = {
  seo: StrapiSeo;

  heroEyebrow: string | null;
  heroHeading: string | null;
  heroSubtext: string | null;
  heroImage: StrapiMedia | null;

  contactDetails: ContactDetail[] | null;
  /** Must stay in sync with the zod enum on the contact form. */
  formSubjects: string[] | null;

  workshopImage: StrapiMedia | null;
  workshopLabel: string | null;
  workshopLocation: string | null;
  workshopDirectionsUrl: string | null;
  mapEmbedUrl: string | null;

  faqEyebrow: string | null;
  faqHeading: string | null;
  faqs: Faq[] | null;

  cta: StrapiCta;
};

export type SocialLink = {
  platform: "Instagram" | "Twitter" | "Facebook" | "Youtube";
  url: string | null;
};

export type GlobalSettings = {
  siteName: string | null;
  tagline: string | null;
  logo: StrapiMedia | null;
  logoLight: StrapiMedia | null;
  navLinks: StrapiNavLink[] | null;
  footerQuickLinks: StrapiNavLink[] | null;
  socialLinks: SocialLink[] | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  contactHours: string | null;
  copyright: string | null;
  defaultSeo: StrapiSeo;
};

/* ──────────────────────────── query options ──────────────────────────── */

/**
 * The whole catalogue, grouped by category the way the hardcoded array was — which
 * is the order the grid's default "Newest" sort leaves untouched.
 *
 * `Product` has no `order` field of its own (only `Category` does), so intra-category
 * order falls back to insertion order — which is the order the seed lists them in.
 * Giving an editor control over it needs an `order` integer on the content type.
 */
export const productsQuery = () =>
  queryOptions({
    queryKey: ["strapi", "products"] as const,
    queryFn: async (): Promise<Product[]> => {
      const { data } = await strapiFetchList<StrapiProduct>(
        `/products?sort[0]=category.order:asc&sort[1]=id:asc&${PAGE_SIZE}`,
      );
      return data.map(toProduct);
    },
    staleTime: STALE_TIME,
  });

/**
 * One product by slug.
 *
 * Strapi 5 addresses entries by `documentId`, so `findOne` cannot be used with a
 * slug — this is a filtered collection read that takes the first hit. Resolves to
 * `null` when nothing matches, which the route turns into `notFound()`.
 */
export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["strapi", "product", slug] as const,
    queryFn: async (): Promise<Product | null> => {
      const { data } = await strapiFetchList<StrapiProduct>(
        `/products?filters[slug][$eq]=${encodeURIComponent(slug)}`,
      );
      return data[0] ? toProduct(data[0]) : null;
    },
    staleTime: STALE_TIME,
  });

/** Drives the filter pills and the footer Products column. `"All"` stays UI-only. */
export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["strapi", "categories"] as const,
    queryFn: async (): Promise<StrapiCategory[]> => {
      const { data } = await strapiFetchList<StrapiCategory>("/categories?sort=order:asc");
      return data;
    },
    staleTime: STALE_TIME,
  });

/** 30 images — the explicit page size is load-bearing, not decoration. */
export const galleryQuery = () =>
  queryOptions({
    queryKey: ["strapi", "gallery"] as const,
    queryFn: async (): Promise<GalleryImage[]> => {
      const { data } = await strapiFetchList<StrapiGalleryImage>(
        `/gallery-images?sort=order:asc&${PAGE_SIZE}`,
      );
      return data.map(toGalleryImage);
    },
    staleTime: STALE_TIME,
  });

export const homePageQuery = () =>
  queryOptions({
    queryKey: ["strapi", "home-page"] as const,
    queryFn: () => strapiFetch<HomePage>("/home-page"),
    staleTime: STALE_TIME,
  });

export const aboutPageQuery = () =>
  queryOptions({
    queryKey: ["strapi", "about-page"] as const,
    queryFn: () => strapiFetch<AboutPage>("/about-page"),
    staleTime: STALE_TIME,
  });

export const contactPageQuery = () =>
  queryOptions({
    queryKey: ["strapi", "contact-page"] as const,
    queryFn: () => strapiFetch<ContactPage>("/contact-page"),
    staleTime: STALE_TIME,
  });

export const globalQuery = () =>
  queryOptions({
    queryKey: ["strapi", "global"] as const,
    queryFn: () => strapiFetch<GlobalSettings>("/global"),
    staleTime: STALE_TIME,
  });

/* ─────────────────────────────── hooks ───────────────────────────────── */

/**
 * The catalogue, for consumers that live outside a route loader.
 *
 * `enabled` exists so the cart provider — which wraps every page — only reaches
 * for the catalogue once there is actually something in the cart to resolve.
 */
export const useProducts = (options?: { enabled?: boolean }) =>
  useQuery({ ...productsQuery(), enabled: options?.enabled ?? true });

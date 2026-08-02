/**
 * Default deep-populate for the read endpoints the frontend uses.
 *
 * Strapi 5 populates nothing by default, so a bare `GET /api/home-page` would
 * return only its scalar fields. Rather than make every caller hand-write a
 * three-level populate object, this middleware fills one in when the request
 * either omits `populate` or asks for the `deep` alias:
 *
 *   GET /api/home-page                 → full payload (default spec)
 *   GET /api/home-page?populate=deep   → full payload (explicit alias)
 *   GET /api/home-page?populate=seo    → exactly what you asked for
 *
 * The per-endpoint specs are the single source of truth for what "everything"
 * means on each page; INTEGRATION.md documents them for the frontend.
 */
import type { Core } from '@strapi/strapi';

type PopulateSpec = Record<string, unknown>;

const SEO: PopulateSpec = { seo: { populate: { ogImage: true } } };

export const HOME_PAGE_POPULATE: PopulateSpec = {
  ...SEO,
  heroSlides: { populate: { image: true } },
  heroStats: true,
  storyImage: true,
  storyInsetImage: true,
  categoryTiles: { populate: { image: true } },
  homeGallery: { populate: { image: true } },
  features: true,
  bestSellers: { populate: { mainImage: true, category: true } },
  testimonials: true,
  newsletter: true,
};

export const ABOUT_PAGE_POPULATE: PopulateSpec = {
  ...SEO,
  heroImage: true,
  storyImage: true,
  materials: { populate: { image: true } },
  craftImage: true,
  craftDetails: true,
  values: true,
  audiences: true,
  cta: true,
};

export const CONTACT_PAGE_POPULATE: PopulateSpec = {
  ...SEO,
  heroImage: true,
  contactDetails: true,
  workshopImage: true,
  faqs: true,
  cta: true,
};

export const GLOBAL_POPULATE: PopulateSpec = {
  logo: true,
  logoLight: true,
  navLinks: true,
  footerQuickLinks: true,
  socialLinks: true,
  defaultSeo: { populate: { ogImage: true } },
};

export const PRODUCT_POPULATE: PopulateSpec = {
  ...SEO,
  category: true,
  mainImage: true,
  gallery: true,
  specs: true,
};

export const GALLERY_IMAGE_POPULATE: PopulateSpec = {
  image: true,
};

export const CATEGORY_POPULATE: PopulateSpec = {};

/** Keyed by the exact request path, without a trailing entry segment. */
const SPEC_BY_PATH: Record<string, PopulateSpec> = {
  '/api/home-page': HOME_PAGE_POPULATE,
  '/api/about-page': ABOUT_PAGE_POPULATE,
  '/api/contact-page': CONTACT_PAGE_POPULATE,
  '/api/global': GLOBAL_POPULATE,
  '/api/products': PRODUCT_POPULATE,
  '/api/gallery-images': GALLERY_IMAGE_POPULATE,
  '/api/categories': CATEGORY_POPULATE,
};

/** `/api/products` matches directly; `/api/products/abc123` matches its parent. */
const specFor = (path: string): PopulateSpec | undefined => {
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  if (clean in SPEC_BY_PATH) return SPEC_BY_PATH[clean];

  const parent = clean.slice(0, clean.lastIndexOf('/'));
  return SPEC_BY_PATH[parent];
};

export default (_config: unknown, _deps: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (ctx.method !== 'GET') return next();

    const spec = specFor(ctx.path);
    if (!spec) return next();

    const requested = ctx.query?.populate;
    if (requested === undefined || requested === 'deep') {
      ctx.query = { ...ctx.query, populate: spec };
    }

    return next();
  };
};

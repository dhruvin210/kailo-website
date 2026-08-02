/**
 * Idempotent content seed.
 *
 * Safe to run as many times as you like: collections upsert on their unique
 * key (`slug` for categories and products, `order` for gallery images), single
 * types upsert on "the one document", and every Media Library upload is keyed
 * by a stable file name. Nothing is duplicated and nothing an editor changed
 * in the admin survives — a re-seed restores the canonical values from
 * ./data.ts, which is the point.
 */
import type { Core, UID } from '@strapi/strapi';

import { MediaLibrary, type UploadedFile } from './assets';
import {
  ABOUT_PAGE,
  CATEGORIES,
  CONTACT_PAGE,
  GALLERY_IMAGES,
  GLOBAL,
  HOME_PAGE,
  PRODUCTS,
  RETIRED_ASSET_NAMES,
  RETIRED_CATEGORY_SLUGS,
  RETIRED_PRODUCT_SLUGS,
  type ImageRef,
} from './data';

/**
 * Bump to force a re-seed on the next boot of an already-seeded database.
 *
 * 7 — the published contact details (email, phone, address) and everything that
 *     followed them off the old US placeholders: the map links, the workshop
 *     location and the wholesale address in the FAQ answers.
 * 8 — the Contact rebuild: six enquiry types in place of the old four subjects,
 *     a new FAQ set, the hero copy and its image, and a CTA that points at the
 *     form rather than at a mail client.
 * 9 — Contact's hero goes full-bleed, so its image and OG image move to `hero2`,
 *     one of the four wide frames the homepage carousel runs on.
 * 10 — Three categories, not six: bag size and strap material stop being lines
 *     of their own and go back to being product attributes. Every product is
 *     re-filed, and the homepage tiles and footer links follow.
 */
export const SEED_VERSION = '10';

const STORE = { type: 'plugin', name: 'kailo-seed' } as const;

type Json = Record<string, unknown>;

/* ─────────────────────────── helpers ─────────────────────────── */

/**
 * The Document Service types its `data` argument against one concrete
 * content-type UID. This seed drives nine content types through two shared
 * helpers, so the UID is only known at runtime and the generic collapses to an
 * index signature that rejects any plain object.
 *
 * This is the single, deliberate escape hatch in the seed. Everything above it
 * — the shape of every entry in ./data.ts — stays fully typed, and Strapi
 * validates the payload against the real schema at runtime regardless.
 */
type DocumentData = Parameters<
  ReturnType<Core.Strapi['documents']>['create']
>[0]['data'];

const asDocumentData = (data: Json): DocumentData => data as DocumentData;

/** Upsert a collection entry matched by one unique field, publish it, and
 *  return its documentId — which is how relations reference it. */
const upsertBy = async (
  strapi: Core.Strapi,
  uid: UID.ContentType,
  where: Json,
  data: Json
): Promise<string> => {
  const documents = strapi.documents(uid);
  const existing = await documents.findFirst({ filters: where, status: 'draft' });

  const entry = existing
    ? await documents.update({
        documentId: existing.documentId,
        data: asDocumentData(data),
        status: 'published',
      })
    : await documents.create({ data: asDocumentData(data), status: 'published' });

  if (!entry) {
    throw new Error(`[seed] ${uid} upsert returned nothing for ${JSON.stringify(where)}`);
  }

  return entry.documentId;
};

/** Upsert the single document behind a single type, then publish it. */
const upsertSingle = async (
  strapi: Core.Strapi,
  uid: UID.ContentType,
  data: Json
): Promise<void> => {
  const documents = strapi.documents(uid);
  const existing = await documents.findFirst({ status: 'draft' });

  if (existing) {
    await documents.update({
      documentId: existing.documentId,
      data: asDocumentData(data),
      status: 'published',
    });
  } else {
    await documents.create({ data: asDocumentData(data), status: 'published' });
  }
};

/** `{ asset }` → Media Library upload; `{ url }` → download, then upload. */
const resolveImage = async (
  media: MediaLibrary,
  ref: ImageRef,
  alt: string
): Promise<UploadedFile | null> =>
  'asset' in ref ? media.local(ref.asset, alt, alt) : media.remote(ref.url, alt);

const seoFor = async (
  media: MediaLibrary,
  seo: { metaTitle: string; metaDescription: string; ogImageAsset?: string; canonicalUrl: string }
): Promise<Json> => {
  const ogImage = seo.ogImageAsset ? await media.local(seo.ogImageAsset, seo.metaTitle) : null;

  return {
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    ogImage: ogImage?.id ?? null,
    canonicalUrl: seo.canonicalUrl,
  };
};

/** Delete every entry matching one of `slugs`, if it is still there. */
const deleteBySlug = async (
  strapi: Core.Strapi,
  uid: UID.ContentType,
  slugs: readonly string[]
): Promise<number> => {
  const documents = strapi.documents(uid);
  let deleted = 0;

  for (const slug of slugs) {
    // Same runtime-only-UID story as `upsertBy`: the filter has to reach the
    // Document Service as a plain object, not a checked literal.
    const where: Json = { slug };
    const existing = await documents.findFirst({ filters: where, status: 'draft' });
    if (!existing) continue;

    await documents.delete({ documentId: existing.documentId });
    deleted += 1;
  }

  return deleted;
};

/**
 * Delete Media Library entries by upload `name`, files on disk included.
 *
 * `findExisting` in ./assets looks uploads up by that same name, so a name is a
 * stable handle on an original whether it came from the frontend assets folder
 * or from a download.
 */
const deleteUploads = async (strapi: Core.Strapi, names: readonly string[]): Promise<number> => {
  const upload = strapi.plugin('upload').service('upload');
  let deleted = 0;

  for (const name of names) {
    const files = await strapi.db.query('plugin::upload.file').findMany({ where: { name } });

    for (const file of files) {
      await upload.remove(file);
      deleted += 1;
    }
  }

  return deleted;
};

/* ──────────────────────────── steps ──────────────────────────── */

/**
 * Remove the categories, products, images and gallery rows the lineup dropped.
 *
 * Runs before the upserts so a retired slug can be reused by a new entry without
 * colliding, and is a no-op on a database that never had them.
 *
 * Gallery images are keyed by `order`, which is the position in GALLERY_IMAGES —
 * so shortening that list leaves the tail rows behind, pointing at whatever they
 * held before. Anything past the new length goes.
 */
const pruneRetired = async (strapi: Core.Strapi): Promise<void> => {
  const products = await deleteBySlug(strapi, 'api::product.product', RETIRED_PRODUCT_SLUGS);
  const categories = await deleteBySlug(strapi, 'api::category.category', RETIRED_CATEGORY_SLUGS);

  const galleryDocuments = strapi.documents('api::gallery-image.gallery-image');
  const stale = await galleryDocuments.findMany({
    filters: { order: { $gt: GALLERY_IMAGES.length } },
    status: 'draft',
  });

  for (const entry of stale) {
    await galleryDocuments.delete({ documentId: entry.documentId });
  }

  // Last, so nothing still relates to these files when they go.
  const uploads = await deleteUploads(strapi, RETIRED_ASSET_NAMES);

  if (products + categories + stale.length + uploads > 0) {
    strapi.log.info(
      `[seed] pruned ${products} product(s), ${categories} category(ies), ` +
        `${stale.length} gallery image(s), ${uploads} upload(s)`
    );
  }
};

const seedCategories = async (
  strapi: Core.Strapi
): Promise<Map<string, string>> => {
  const byName = new Map<string, string>();

  for (const category of CATEGORIES) {
    const documentId = await upsertBy(
      strapi,
      'api::category.category',
      { slug: category.slug },
      {
        name: category.name,
        slug: category.slug,
        tagline: category.tagline,
        order: category.order,
      }
    );

    byName.set(category.name, documentId);
  }

  strapi.log.info(`[seed] ${CATEGORIES.length} categories`);
  return byName;
};

const seedProducts = async (
  strapi: Core.Strapi,
  media: MediaLibrary,
  categoryIds: Map<string, string>
): Promise<Map<string, string>> => {
  const bySlug = new Map<string, string>();

  for (const product of PRODUCTS) {
    const mainImage = await resolveImage(media, product.mainImage, product.name);

    const gallery: number[] = [];
    const remoteGalleryUrls: string[] = [];

    for (const ref of product.gallery) {
      const file = await resolveImage(media, ref, product.name);
      if (file) gallery.push(file.id);
      else if ('url' in ref) remoteGalleryUrls.push(ref.url);
    }

    const documentId = await upsertBy(
      strapi,
      'api::product.product',
      { slug: product.slug },
      {
        name: product.name,
        slug: product.slug,
        category: categoryIds.get(product.category) ?? null,
        price: product.price,
        rating: product.rating,
        reviews: product.reviews,
        mainImage: mainImage?.id ?? null,
        gallery,
        // Only meaningful when a download failed; otherwise the CMS owns the file.
        remoteImageUrl: !mainImage && 'url' in product.mainImage ? product.mainImage.url : null,
        remoteGalleryUrls: remoteGalleryUrls.length > 0 ? remoteGalleryUrls : null,
        description: product.description,
        specs: product.specs,
        badge: product.badge ?? null,
        stock: product.stock,
        seo: {
          metaTitle: `${product.name} — Kailo`,
          metaDescription: product.description,
          canonicalUrl: `/products/${product.slug}`,
        },
      }
    );

    bySlug.set(product.slug, documentId);
  }

  strapi.log.info(`[seed] ${PRODUCTS.length} products`);
  return bySlug;
};

const seedGalleryImages = async (strapi: Core.Strapi, media: MediaLibrary): Promise<void> => {
  let created = 0;

  for (const item of GALLERY_IMAGES) {
    const file = await media.local(item.asset, item.alt, item.alt);

    if (!file) {
      strapi.log.warn(`[seed] skipping gallery image ${item.asset} — no file`);
      continue;
    }

    // `order` is the stable key here: gallery entries have no slug, and the
    // position in gallery.tsx is exactly what identifies them.
    await upsertBy(
      strapi,
      'api::gallery-image.gallery-image',
      { order: item.order },
      {
        image: file.id,
        category: item.category,
        alt: item.alt,
        caption: null,
        order: item.order,
      }
    );

    created += 1;
  }

  strapi.log.info(`[seed] ${created} gallery images`);
};

const seedGlobal = async (strapi: Core.Strapi, media: MediaLibrary): Promise<void> => {
  const logo = await media.local(GLOBAL.logoAsset, `${GLOBAL.siteName} logo`);
  const logoLight = await media.local(GLOBAL.logoLightAsset, `${GLOBAL.siteName} logo`);

  await upsertSingle(strapi, 'api::global.global', {
    siteName: GLOBAL.siteName,
    tagline: GLOBAL.tagline,
    logo: logo?.id ?? null,
    logoLight: logoLight?.id ?? null,
    navLinks: GLOBAL.navLinks,
    footerQuickLinks: GLOBAL.footerQuickLinks,
    socialLinks: GLOBAL.socialLinks,
    contactEmail: GLOBAL.contactEmail,
    contactPhone: GLOBAL.contactPhone,
    contactAddress: GLOBAL.contactAddress,
    contactHours: GLOBAL.contactHours,
    copyright: GLOBAL.copyright,
    defaultSeo: await seoFor(media, GLOBAL.defaultSeo),
  });

  strapi.log.info('[seed] global');
};

const seedHomePage = async (
  strapi: Core.Strapi,
  media: MediaLibrary,
  productIds: Map<string, string>
): Promise<void> => {
  const heroSlides: Json[] = [];
  for (const slide of HOME_PAGE.heroSlides) {
    const file = await media.local(slide.asset, slide.alt, slide.alt);
    if (file) heroSlides.push({ image: file.id, alt: slide.alt, position: slide.position });
  }

  const categoryTiles: Json[] = [];
  for (const tile of HOME_PAGE.categoryTiles) {
    const file = await media.local(tile.asset, tile.name);
    if (file) {
      categoryTiles.push({
        name: tile.name,
        tagline: tile.tagline,
        image: file.id,
        href: tile.href,
        categoryFilter: tile.categoryFilter,
        position: tile.position,
        feature: tile.feature,
        comingSoon: tile.comingSoon,
      });
    }
  }

  const homeGallery: Json[] = [];
  for (const tile of HOME_PAGE.homeGallery) {
    const file = await media.local(tile.asset, tile.alt, tile.alt);
    if (file) homeGallery.push({ image: file.id, alt: tile.alt, tall: tile.tall });
  }

  const storyImage = await media.local(HOME_PAGE.storyImageAsset, HOME_PAGE.storyHeading);
  const storyInsetImage = await media.local(
    HOME_PAGE.storyInsetImageAsset,
    'A Kailo artisan hand-stitching leather at the workbench'
  );

  const bestSellers = HOME_PAGE.bestSellerSlugs
    .map((slug) => productIds.get(slug))
    .filter((id): id is string => Boolean(id));

  await upsertSingle(strapi, 'api::home-page.home-page', {
    seo: await seoFor(media, HOME_PAGE.seo),

    heroEyebrow: HOME_PAGE.heroEyebrow,
    heroHeadingLine1: HOME_PAGE.heroHeadingLine1,
    heroHeadingLine2: HOME_PAGE.heroHeadingLine2,
    heroSubtext: HOME_PAGE.heroSubtext,
    heroPrimaryCtaLabel: HOME_PAGE.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: HOME_PAGE.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: HOME_PAGE.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: HOME_PAGE.heroSecondaryCtaHref,
    heroSlides,
    heroStats: HOME_PAGE.heroStats,

    storyEyebrow: HOME_PAGE.storyEyebrow,
    storyHeading: HOME_PAGE.storyHeading,
    storyBody: HOME_PAGE.storyBody,
    storyBodySecondary: HOME_PAGE.storyBodySecondary,
    storyChips: HOME_PAGE.storyChips,
    storyStatValue: HOME_PAGE.storyStatValue,
    storyStatLabel: HOME_PAGE.storyStatLabel,
    storyImage: storyImage?.id ?? null,
    storyInsetImage: storyInsetImage?.id ?? null,
    storyCtaLabel: HOME_PAGE.storyCtaLabel,
    storyCtaHref: HOME_PAGE.storyCtaHref,

    categoriesEyebrow: HOME_PAGE.categoriesEyebrow,
    categoriesHeading: HOME_PAGE.categoriesHeading,
    categoryTiles,

    galleryEyebrow: HOME_PAGE.galleryEyebrow,
    galleryHeading: HOME_PAGE.galleryHeading,
    galleryDescription: HOME_PAGE.galleryDescription,
    homeGallery,

    whyEyebrow: HOME_PAGE.whyEyebrow,
    whyHeading: HOME_PAGE.whyHeading,
    features: HOME_PAGE.features,

    bestSellersEyebrow: HOME_PAGE.bestSellersEyebrow,
    bestSellersHeading: HOME_PAGE.bestSellersHeading,
    bestSellersDescription: HOME_PAGE.bestSellersDescription,
    bestSellers,

    testimonialsEyebrow: HOME_PAGE.testimonialsEyebrow,
    testimonialsHeading: HOME_PAGE.testimonialsHeading,
    testimonialsDescription: HOME_PAGE.testimonialsDescription,
    testimonials: HOME_PAGE.testimonials,

    newsletter: HOME_PAGE.newsletter,
  });

  strapi.log.info('[seed] home page');
};

const seedAboutPage = async (strapi: Core.Strapi, media: MediaLibrary): Promise<void> => {
  const heroImage = await media.local(ABOUT_PAGE.heroImageAsset, ABOUT_PAGE.heroSubtext);
  const storyImage = await media.local(ABOUT_PAGE.storyImageAsset, 'Inside the Kailo workshop');
  const craftImage = await media.local(
    ABOUT_PAGE.craftImageAsset,
    'A Kailo craftsperson hand-stitching a leather ukulele bag'
  );

  const materials: Json[] = [];
  for (const material of ABOUT_PAGE.materials) {
    const image = await media.local(material.imageAsset, `${material.name} — ${material.meta}`);
    materials.push({
      name: material.name,
      meta: material.meta,
      body: material.body,
      image: image?.id ?? null,
    });
  }

  await upsertSingle(strapi, 'api::about-page.about-page', {
    seo: await seoFor(media, ABOUT_PAGE.seo),

    heroEyebrow: ABOUT_PAGE.heroEyebrow,
    heroHeadingLine1: ABOUT_PAGE.heroHeadingLine1,
    heroHeadingLine2: ABOUT_PAGE.heroHeadingLine2,
    heroSubtext: ABOUT_PAGE.heroSubtext,
    heroImage: heroImage?.id ?? null,

    storyEyebrow: ABOUT_PAGE.storyEyebrow,
    storyHeading: ABOUT_PAGE.storyHeading,
    storyLead: ABOUT_PAGE.storyLead,
    storyParagraphs: ABOUT_PAGE.storyParagraphs,
    storyPullQuote: ABOUT_PAGE.storyPullQuote,
    storyChips: ABOUT_PAGE.storyChips,
    storyImage: storyImage?.id ?? null,
    storyStatValue: ABOUT_PAGE.storyStatValue,
    storyStatLabel: ABOUT_PAGE.storyStatLabel,

    materialsEyebrow: ABOUT_PAGE.materialsEyebrow,
    materialsHeading: ABOUT_PAGE.materialsHeading,
    materialsDescription: ABOUT_PAGE.materialsDescription,
    materials,

    craftEyebrow: ABOUT_PAGE.craftEyebrow,
    craftHeading: ABOUT_PAGE.craftHeading,
    craftDescription: ABOUT_PAGE.craftDescription,
    craftImage: craftImage?.id ?? null,
    craftDetails: ABOUT_PAGE.craftDetails,

    valuesEyebrow: ABOUT_PAGE.valuesEyebrow,
    valuesHeading: ABOUT_PAGE.valuesHeading,
    values: ABOUT_PAGE.values,

    audienceEyebrow: ABOUT_PAGE.audienceEyebrow,
    audienceHeading: ABOUT_PAGE.audienceHeading,
    audienceDescription: ABOUT_PAGE.audienceDescription,
    audiences: ABOUT_PAGE.audiences,

    cta: ABOUT_PAGE.cta,
  });

  strapi.log.info('[seed] about page');
};

const seedContactPage = async (strapi: Core.Strapi, media: MediaLibrary): Promise<void> => {
  // No city in either string. Both said "Nashville", which is template text this
  // project never corrected — the workshop is in Pune (see CONTACT_PAGE's own
  // address and map links). Alt text describes the frame instead, which is what
  // it is for and what cannot go stale.
  const heroImage = await media.local(
    CONTACT_PAGE.heroImageAsset,
    'The Kailo workshop bench in window light'
  );
  const workshopImage = await media.local(
    CONTACT_PAGE.workshopImageAsset,
    'A Kailo craftsperson hand-stitching leather at the workshop bench'
  );

  await upsertSingle(strapi, 'api::contact-page.contact-page', {
    seo: await seoFor(media, CONTACT_PAGE.seo),

    heroEyebrow: CONTACT_PAGE.heroEyebrow,
    heroHeading: CONTACT_PAGE.heroHeading,
    heroSubtext: CONTACT_PAGE.heroSubtext,
    heroImage: heroImage?.id ?? null,

    contactDetails: CONTACT_PAGE.contactDetails,
    formSubjects: CONTACT_PAGE.formSubjects,

    workshopImage: workshopImage?.id ?? null,
    workshopLabel: CONTACT_PAGE.workshopLabel,
    workshopLocation: CONTACT_PAGE.workshopLocation,
    workshopDirectionsUrl: CONTACT_PAGE.workshopDirectionsUrl,
    mapEmbedUrl: CONTACT_PAGE.mapEmbedUrl,

    faqEyebrow: CONTACT_PAGE.faqEyebrow,
    faqHeading: CONTACT_PAGE.faqHeading,
    faqs: CONTACT_PAGE.faqs,

    cta: CONTACT_PAGE.cta,
  });

  strapi.log.info('[seed] contact page');
};

/* ──────────────────────────── entry ──────────────────────────── */

export const runSeed = async (strapi: Core.Strapi): Promise<void> => {
  const startedAt = Date.now();
  strapi.log.info('[seed] starting');

  const media = new MediaLibrary(strapi);

  await pruneRetired(strapi);
  const categoryIds = await seedCategories(strapi);
  const productIds = await seedProducts(strapi, media, categoryIds);
  await seedGalleryImages(strapi, media);
  await seedGlobal(strapi, media);
  await seedHomePage(strapi, media, productIds);
  await seedAboutPage(strapi, media);
  await seedContactPage(strapi, media);

  if (media.missingAssets.length > 0) {
    strapi.log.warn(
      `[seed] ${media.missingAssets.length} asset(s) missing from ${media.root}: ` +
        `${media.missingAssets.join(', ')}. Set KAILO_ASSETS_DIR if your checkout differs.`
    );
  }

  if (media.skippedDownloads.length > 0) {
    strapi.log.warn(
      `[seed] ${media.skippedDownloads.length} remote image(s) could not be downloaded; ` +
        'those products kept their remoteImageUrl fallback. Re-run `npm run seed` when online.'
    );
  }

  await strapi.store(STORE).set({ key: 'version', value: SEED_VERSION });

  strapi.log.info(`[seed] done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
};

/**
 * Called from bootstrap. Runs at most once per SEED_VERSION, and only when
 * SEED_ON_BOOT is not explicitly disabled.
 */
export const runSeedOnce = async (strapi: Core.Strapi): Promise<void> => {
  if (process.env.SEED_ON_BOOT === 'false') return;

  const store = strapi.store(STORE);
  const seededVersion = await store.get({ key: 'version' });

  if (seededVersion === SEED_VERSION) {
    strapi.log.debug(`[seed] already seeded at version ${SEED_VERSION} — skipping`);
    return;
  }

  await runSeed(strapi);
};

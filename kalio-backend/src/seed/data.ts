/**
 * Canonical Kailo content, transcribed from the frontend so the CMS and the
 * hardcoded pages agree exactly. Source files:
 *
 *   kalio-frontend/src/lib/products.ts        → CATEGORIES, PRODUCTS
 *   kalio-frontend/src/routes/index.tsx       → HOME_PAGE
 *   kalio-frontend/src/routes/about.tsx       → ABOUT_PAGE
 *   kalio-frontend/src/routes/gallery.tsx     → GALLERY_IMAGES
 *   kalio-frontend/src/routes/contact.tsx     → CONTACT_PAGE
 *   kalio-frontend/src/components/Footer.tsx  → GLOBAL (footer half)
 *   kalio-frontend/src/components/Navbar.tsx  → GLOBAL (nav half)
 *
 * `asset` values are keys into ASSETS in ./assets.ts, not paths.
 */

/* ────────────────────────── categories ────────────────────────── */

export type CategorySeed = {
  name: string;
  slug: string;
  tagline: string;
  order: number;
};

/**
 * The catalogue is filed by what a customer actually chooses between: a bag's
 * size, a strap's material. "Ukulele Bags" and "Ukulele Straps" were the two
 * parents these replace — the taxonomy is deliberately one flat level, so a
 * category name is both the filter pill and the thing that carries a price.
 */
export const CATEGORIES: CategorySeed[] = [
  { name: 'Tenor Size Bags', slug: 'tenor-size-bags', tagline: 'Cut for the tenor body', order: 1 },
  {
    name: 'Concert Size Bags',
    slug: 'concert-size-bags',
    tagline: 'Cut for the concert body',
    order: 2,
  },
  { name: 'Denim', slug: 'denim', tagline: 'Raw indigo, gold stitch', order: 3 },
  { name: 'Suede Leather', slug: 'suede-leather', tagline: 'Soft from the first wear', order: 4 },
  { name: 'NDM Leather', slug: 'ndm-leather', tagline: 'Hand-stitched full-grain', order: 5 },
  { name: 'Ukuleles', slug: 'ukuleles', tagline: 'Coming soon', order: 6 },
];

/**
 * Content the lineup no longer carries.
 *
 * The upserts above only ever create or update, so an entry dropped from
 * CATEGORIES or PRODUCTS would otherwise linger in an already-seeded database —
 * still filling a filter pill or a product grid. These slugs are deleted on
 * re-seed instead. Listing them explicitly (rather than deleting anything absent
 * from the arrays) keeps products an editor added in the admin untouched.
 */
export const RETIRED_CATEGORY_SLUGS = [
  'cases',
  'straps',
  'tuners',
  'picks',
  'cleaning-kits',
  // The two parents the size/material split replaced. Their products are
  // re-filed onto the new categories by `seedProducts`, so dropping these only
  // removes two now-empty filter pills.
  'ukulele-bags',
  'ukulele-straps',
];

export const RETIRED_PRODUCT_SLUGS = [
  'clip-tuner',
  'pedal-tuner',
  'pick-set',
  'capo',
  'string-kit',
  'polish-kit',
  // The generic-accessory placeholders, replaced by the real bags and straps
  // below. Their slugs are part of the URL, so they are retired rather than
  // renamed in place.
  'ukulele-case',
  'guitar-case',
  'violin-case',
  'leather-strap',
  'neoprene-strap',
  'woven-strap',
];

/**
 * Media Library entries for those products, by upload `name`.
 *
 * The originals are gone from `kalio-frontend/src/assets` and from the Unsplash
 * list, but the Media Library keeps its own copies — so a re-seed deletes these
 * too, taking the files under `public/uploads` with them. Names match what
 * `MediaLibrary` stores: an ASSETS key for a local original, `remoteAssetName`'s
 * output for a downloaded one.
 */
export const RETIRED_ASSET_NAMES = [
  'product-clip-tuner',
  'product-pick-set',
  'product-cleaning-kit',
  'unsplash-photo-1607004468138-e7e23ea26947-sig10',
  'unsplash-photo-1471478331149-c72f17e33c73-sig12',
  'unsplash-photo-1574258495973-f010dfbb5371-sig14',
  // The AI-generated product renders and the stock photography they leaned on,
  // both superseded by Kailo's own shoot.
  'product-ukulele-case',
  'product-violin-case',
  'product-leather-strap',
  'unsplash-photo-1510915361894-db8b60106cb1-sig2',
  'unsplash-photo-1510915361894-db8b60106cb1-sig3',
  'unsplash-photo-1493225457124-a3eb161ffa5f-sig4',
  'unsplash-photo-1556449895-a33c9dba33dd-sig7',
  'unsplash-photo-1493225457124-a3eb161ffa5f-sig8',
];

/* ─────────────────────────── products ─────────────────────────── */

/** An image is either a bundled frontend asset or a remote URL to fetch. */
export type ImageRef = { asset: string } | { url: string };

export type ProductSeed = {
  slug: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  mainImage: ImageRef;
  gallery: ImageRef[];
  description: string;
  specs: { label: string; value: string }[];
  badge?: 'NEW' | 'SALE';
  stock: number;
};

/**
 * The real catalogue, shot in the Kailo showroom.
 *
 * Names, descriptions, specs and imagery describe what is actually in the
 * photographs. `price` is set by the product's category — every bag in a size
 * costs the same, every strap in a material costs the same:
 *
 *   Tenor Size Bags ₹5,000 · Concert Size Bags ₹4,500
 *   Denim ₹600 · Suede Leather ₹800 · NDM Leather ₹800
 *
 * `rating`, `reviews` and `stock` are still inherited from the placeholder
 * catalogue this replaced and want real numbers.
 */
export const PRODUCTS: ProductSeed[] = [
  {
    slug: 'leather-ukulele-bag-brown',
    name: 'Leather Ukulele Bag — Brown',
    category: 'Tenor Size Bags',
    price: 5000,
    rating: 4.8,
    reviews: 124,
    mainImage: { asset: 'bag-showroom-trio' },
    gallery: [{ asset: 'bag-showroom-trio' }, { asset: 'bag-lineup-four' }],
    description:
      'Full-grain leather over a padded shell, in a brown that only deepens with playing. The flap pocket swallows picks, spare strings and a tuner; twin handles and backpack straps get you to the gig either way.',
    specs: [
      { label: 'Size', value: 'Tenor' },
      { label: 'Material', value: 'Full-grain leather' },
      { label: 'Pocket', value: 'Flap-over front pocket' },
      { label: 'Carry', value: 'Twin handles + backpack straps' },
    ],
    badge: 'NEW',
    stock: 24,
  },
  {
    slug: 'leather-ukulele-bag-black',
    name: 'Leather Ukulele Bag — Black',
    category: 'Tenor Size Bags',
    price: 5000,
    rating: 4.9,
    reviews: 312,
    mainImage: { asset: 'bag-showroom-poster' },
    gallery: [{ asset: 'bag-showroom-poster' }, { asset: 'bag-display-table' }],
    description:
      'The same padded leather body in a deep black, with a zip pocket across the front instead of a flap. Understated on a dark stage, and it hides a scuff better than anything else we make.',
    specs: [
      { label: 'Size', value: 'Tenor' },
      { label: 'Material', value: 'Full-grain leather' },
      { label: 'Pocket', value: 'Zip front pocket' },
      { label: 'Carry', value: 'Twin handles + backpack straps' },
    ],
    stock: 12,
  },
  {
    slug: 'leather-ukulele-bag-stone',
    name: 'Leather Ukulele Bag — Stone',
    category: 'Concert Size Bags',
    price: 4500,
    rating: 4.7,
    reviews: 87,
    mainImage: { asset: 'bag-display-table' },
    gallery: [{ asset: 'bag-display-table' }, { asset: 'bag-lineup-four' }],
    description:
      'Washed stone-grey leather with a flap pocket and a detachable shoulder strap. Every hide takes the wash differently, so no two of these are the same colour.',
    specs: [
      { label: 'Size', value: 'Concert' },
      { label: 'Material', value: 'Washed full-grain leather' },
      { label: 'Pocket', value: 'Flap-over front pocket' },
      { label: 'Carry', value: 'Handles + detachable shoulder strap' },
    ],
    stock: 8,
  },
  {
    slug: 'leather-ukulele-strap',
    name: 'Hand-Stitched Leather Ukulele Strap',
    category: 'NDM Leather',
    price: 800,
    rating: 4.9,
    reviews: 421,
    mainImage: { asset: 'strap-leather-brown' },
    gallery: [{ asset: 'strap-leather-brown' }],
    description:
      'Full-grain leather, hand-stitched end to end, on an antique brass slider. The tail ties to the headstock, so it fits a uke with a single strap button — or none at all.',
    specs: [
      { label: 'Material', value: 'Full-grain leather' },
      { label: 'Hardware', value: 'Antique brass slider' },
      { label: 'Fits', value: 'Soprano to baritone' },
    ],
    badge: 'SALE',
    stock: 40,
  },
  {
    slug: 'suede-ukulele-strap',
    name: 'Suede Ukulele Strap',
    category: 'Suede Leather',
    price: 800,
    rating: 4.6,
    reviews: 188,
    mainImage: { asset: 'strap-suede-tan' },
    gallery: [{ asset: 'strap-suede-tan' }],
    description:
      'Embossed tan suede with leather ends and a brass slide. Soft from the first wear and light enough that you forget it through a long set.',
    specs: [
      { label: 'Material', value: 'Embossed suede, leather ends' },
      { label: 'Hardware', value: 'Antique brass slider' },
      { label: 'Fits', value: 'Soprano to baritone' },
    ],
    stock: 60,
  },
  {
    slug: 'denim-ukulele-strap',
    name: 'Denim Ukulele Strap',
    category: 'Denim',
    price: 600,
    rating: 4.7,
    reviews: 96,
    mainImage: { asset: 'strap-denim-indigo' },
    gallery: [{ asset: 'strap-denim-indigo' }, { asset: 'strap-denim-patchwork' }],
    description:
      'Raw indigo denim run through with gold contrast stitching, finished with full-grain leather ends. Also made as a two-tone patchwork, pieced from offcuts.',
    specs: [
      { label: 'Material', value: 'Raw denim, leather ends' },
      { label: 'Hardware', value: 'Antique brass slider' },
      { label: 'Fits', value: 'Soprano to baritone' },
    ],
    stock: 100,
  },
];

/* ──────────────────────── gallery images ──────────────────────── */

export type GalleryImageSeed = {
  asset: string;
  category: 'Products' | 'Lifestyle' | 'Events';
  alt: string;
  order: number;
};

/**
 * Order and category come straight from the IMAGES array in gallery.tsx. The
 * page renders alt text as `Kailo ${cat.toLowerCase()} moment`; where the same
 * asset carries a real description elsewhere in the frontend we use that
 * instead, since generic alt text helps nobody.
 */
const GALLERY_SOURCE: [asset: string, category: 'Products' | 'Lifestyle' | 'Events', alt: string][] =
  [
    ['bag-lineup-four', 'Products', 'Four Kailo leather ukulele bags lined up in the showroom'],
    ['strap-leather-brown', 'Products', 'A hand-stitched Kailo leather ukulele strap'],
    ['lifestyle-artisan', 'Lifestyle', 'A Kailo artisan hand-stitching leather at the workbench'],
    ['bag-display-table', 'Products', 'Kailo leather ukulele bags and straps on the display table'],
    ['lifestyle-workbench', 'Lifestyle', 'The Kailo workshop bench in Nashville'],
    ['lifestyle-ukulele-window', 'Lifestyle', 'A Kailo ukulele bag resting in the window light'],
    ['photo01', 'Events', 'Kailo events moment'],
    ['photo15', 'Products', 'Kailo products moment'],
    ['photo02', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo03', 'Lifestyle', 'A Kailo artisan finishing a handcrafted leather instrument bag'],
    ['photo04', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo05', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo06', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo07', 'Lifestyle', 'A handcrafted Kailo leather ukulele bag'],
    ['photo08', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo09', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo10', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo11', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo12', 'Lifestyle', 'Inside the Kailo workshop'],
    ['photo13', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo14', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo16', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo17', 'Events', 'Kailo events moment'],
    ['photo18', 'Events', 'Kailo events moment'],
    ['photo19', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo20', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo21', 'Lifestyle', 'A musician tuning up before a set'],
    ['photo22', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo23', 'Lifestyle', 'Kailo lifestyle moment'],
    ['photo24', 'Lifestyle', 'Kailo lifestyle moment'],
  ];

export const GALLERY_IMAGES: GalleryImageSeed[] = GALLERY_SOURCE.map(
  ([asset, category, alt], i) => ({ asset, category, alt, order: i + 1 })
);

/* ─────────────────────────── global ───────────────────────────── */

export const GLOBAL = {
  siteName: 'Kailo',
  tagline: 'Crafted with finesse, made to move your soul.',
  logoAsset: 'logo',
  logoLightAsset: 'logo',
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Products', href: '/products' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact Us', href: '/contact' },
  ],
  footerQuickLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
    { label: 'My Account', href: '/account' },
  ],
  socialLinks: [
    { platform: 'Instagram' as const, url: '#' },
    { platform: 'Twitter' as const, url: '#' },
    { platform: 'Facebook' as const, url: '#' },
    { platform: 'Youtube' as const, url: '#' },
  ],
  contactEmail: 'hello@kailo.com',
  contactPhone: '+1 (800) KAILO-01',
  contactAddress: '123 Music Lane, Nashville, TN',
  contactHours: 'Mon–Fri 9AM–6PM EST',
  copyright: '© 2025 Kailo. All rights reserved.',
  defaultSeo: {
    metaTitle: 'Kailo — Premium Instrument Accessories',
    metaDescription: 'Crafted with finesse, made to move your soul.',
    ogImageAsset: 'hero1',
    canonicalUrl: '/',
  },
};

/* ────────────────────────── home page ─────────────────────────── */

export const HOME_PAGE = {
  seo: {
    metaTitle: 'Kailo — Premium Instrument Accessories',
    metaDescription:
      'Crafted with finesse, made to move your soul. Handmade leather ukulele bags and hand-stitched straps for musicians who carry their music with pride.',
    ogImageAsset: 'hero1',
    canonicalUrl: '/',
  },

  heroEyebrow: 'Handcrafted in India',
  heroHeadingLine1: 'Crafted with finesse,',
  heroHeadingLine2: 'made to move your soul',
  heroSubtext:
    'Premium leather ukulele bags and hand-stitched leather & denim straps for artists who carry their music with pride.',
  heroPrimaryCtaLabel: 'Shop the Collection',
  heroPrimaryCtaHref: '/products',
  heroSecondaryCtaLabel: 'Explore the Gallery',
  heroSecondaryCtaHref: '#gallery',
  heroSlides: [
    {
      asset: 'hero1',
      position: '50% 58%',
      alt: 'Three friends in a Goa garden with handcrafted Kailo instrument bags',
    },
    {
      asset: 'hero2',
      position: '55% 50%',
      alt: 'A woman by the river leaning on a tree with a red leather Kailo ukulele bag',
    },
    {
      asset: 'hero3',
      position: '50% 52%',
      alt: 'A musician in a bamboo grove carrying a brown leather Kailo instrument bag',
    },
    {
      asset: 'hero4',
      position: '50% 58%',
      alt: 'A musician on garden steps with a black Kailo ukulele bag',
    },
  ],
  heroStats: [
    { value: '4.9', label: 'Average rating' },
    { value: '2,400+', label: 'Musicians served' },
    { value: '40+', label: 'Countries shipped' },
  ],

  storyEyebrow: 'The Kailo Spirit',
  storyHeading: 'A touch of island spirit for every artist',
  storyBody:
    'At Kailo, we create premium leather ukulele bags and handcrafted leather & denim straps designed for artists who carry their music with pride. Thoughtful textures, rich materials, and a touch of island spirit come together to elevate not just your instrument — but your entire journey with it.',
  storyBodySecondary:
    'Every piece is cut, stitched and finished by hand in small batches, by makers who play as much as they craft.',
  storyChips: ['Full-grain leather', 'Hand-stitched', 'Ships worldwide'],
  storyStatValue: '100%',
  storyStatLabel: 'Hand-finished',
  storyImageAsset: 'photo07',
  storyInsetImageAsset: 'lifestyle-artisan',
  storyCtaLabel: 'Read our story',
  storyCtaHref: '/about',

  categoriesEyebrow: 'Browse',
  categoriesHeading: 'Shop by Category',
  /**
   * One tile per entry in CATEGORIES — `categoryFilter` must match a `name`
   * exactly, or the shop drops the filter and lands on "All".
   *
   * Six tiles, so none is a feature: the bento's feature tile spans two columns
   * and both rows, which leaves room for exactly two others. Without it the same
   * grid is an even 3×2. Set `feature: true` on one tile again only if the list
   * is back down to three.
   */
  categoryTiles: [
    {
      name: 'Tenor Size Bags',
      tagline: 'Cut for the tenor body',
      asset: 'bag-lineup-four',
      href: '/products',
      categoryFilter: 'Tenor Size Bags',
      position: 'center center',
      feature: false,
      comingSoon: false,
    },
    {
      name: 'Concert Size Bags',
      tagline: 'Cut for the concert body',
      asset: 'bag-display-table',
      href: '/products',
      categoryFilter: 'Concert Size Bags',
      position: 'center center',
      feature: false,
      comingSoon: false,
    },
    {
      name: 'Denim',
      tagline: 'Raw indigo, gold stitch',
      asset: 'strap-denim-indigo',
      href: '/products',
      categoryFilter: 'Denim',
      position: 'center center',
      feature: false,
      comingSoon: false,
    },
    {
      name: 'Suede Leather',
      tagline: 'Soft from the first wear',
      asset: 'strap-suede-tan',
      href: '/products',
      categoryFilter: 'Suede Leather',
      position: 'center center',
      feature: false,
      comingSoon: false,
    },
    {
      name: 'NDM Leather',
      tagline: 'Hand-stitched full-grain',
      asset: 'strap-leather-brown',
      href: '/products',
      categoryFilter: 'NDM Leather',
      // The strap hangs down the left of the frame; bias the crop that way.
      position: '40% center',
      feature: false,
      comingSoon: false,
    },
    {
      name: 'Ukuleles',
      tagline: 'The instrument itself',
      asset: 'lifestyle-ukulele-window',
      href: '/products',
      categoryFilter: 'Ukuleles',
      position: 'center center',
      feature: false,
      comingSoon: true,
    },
  ],

  galleryEyebrow: 'Moments',
  galleryHeading: 'Our Gallery',
  galleryDescription: 'Products, musicians, workshops, events and the moments in between.',
  homeGallery: [
    { asset: 'gallery1', alt: 'A Kailo ukulele bag on the road', tall: true },
    { asset: 'photo21', alt: 'A musician tuning up before a set', tall: false },
    { asset: 'gallery3', alt: 'Behind the scenes at a Kailo workshop', tall: false },
    { asset: 'gallery4', alt: 'A performance lit by evening light', tall: true },
    { asset: 'gallery5', alt: 'Hand-stitched leather detailing', tall: false },
    { asset: 'gallery6', alt: 'Friends playing together outdoors', tall: false },
  ],

  // The homepage no longer renders a "Why Kailo" band, but the section is
  // modelled and seeded so it can be switched back on from the CMS alone.
  whyEyebrow: 'Why Kailo',
  whyHeading: 'Built by musicians, for musicians',
  features: [
    {
      icon: 'Sparkles',
      title: 'Premium Craftsmanship',
      body: 'Full-grain leather, real brass and recycled fabrics, cut and stitched by hand in small batches.',
    },
    {
      icon: 'Music',
      title: 'Made for Musicians',
      body: 'Every piece is designed and road-tested by people who play — on stage, in the studio, at home.',
    },
    {
      icon: 'Truck',
      title: 'Worldwide Delivery',
      body: 'Tracked shipping to 40+ countries, typically landing in three to seven business days.',
    },
  ],

  bestSellersEyebrow: 'Loved by artists',
  bestSellersHeading: 'Our Best Sellers',
  bestSellersDescription: 'The pieces musicians keep coming back for.',
  /**
   * index.tsx derives best sellers as "the four most-reviewed products", which
   * across this lineup is the leather strap (421), the black bag (312), the suede
   * strap (188) and the brown bag (124). Seeding that exact set keeps the rendered
   * page identical while handing editors the ability to override it.
   */
  bestSellerSlugs: [
    'leather-ukulele-strap',
    'leather-ukulele-bag-black',
    'suede-ukulele-strap',
    'leather-ukulele-bag-brown',
  ],

  testimonialsEyebrow: 'Testimonials',
  testimonialsHeading: 'Kind Words',
  testimonialsDescription: 'Trusted on stages worldwide.',
  testimonials: [
    {
      initials: 'AM',
      name: 'Aria Mendes',
      role: 'Session guitarist',
      location: 'Lisbon, Portugal',
      rating: 5,
      quote:
        'The leather strap broke in beautifully within a week. It feels like it was made for my shoulder.',
    },
    {
      initials: 'DK',
      name: 'Devon Kaur',
      role: 'Touring ukulele player',
      location: 'Melbourne, Australia',
      rating: 5,
      quote:
        'My ukulele case survived three flights without a scratch. Kailo just gets touring life.',
    },
    {
      initials: 'PS',
      name: 'Priya Suresh',
      role: 'Studio producer',
      location: 'Chennai, India',
      rating: 5,
      quote: 'Gorgeous materials and thoughtful details. It is rare to find gear this considered.',
    },
    {
      initials: 'MF',
      name: 'Milo Ferreira',
      role: 'Violinist, chamber quartet',
      location: 'São Paulo, Brazil',
      rating: 5,
      quote:
        'Twelve cities in five weeks and the carbon shell still closes like the day it arrived.',
    },
    {
      initials: 'HI',
      name: 'Hana Ito',
      role: 'Singer-songwriter',
      location: 'Kyoto, Japan',
      rating: 5,
      quote: 'Every detail feels intentional — the stitching, the lining, even the way it smells.',
    },
    {
      initials: 'NB',
      name: 'Noah Bergman',
      role: 'Bassist',
      location: 'Berlin, Germany',
      rating: 5,
      quote: 'Three sets a night and my shoulder no longer complains. That alone was worth it.',
    },
  ],

  newsletter: {
    heading: 'Join the Kailo circle',
    body: 'Be first to hear about new drops, workshop stories and the occasional subscriber-only offer.',
    buttonLabel: 'Subscribe',
    buttonHref: '#newsletter',
  },
};

/* ────────────────────────── about page ────────────────────────── */

export const ABOUT_PAGE = {
  seo: {
    metaTitle: 'About — Kailo',
    metaDescription:
      'Kailo was founded by musicians, for musicians. Learn how a love of the ukulele became a workshop making leather bags worth carrying.',
    ogImageAsset: 'photo03',
    canonicalUrl: '/about',
  },

  heroEyebrow: 'Our Story',
  heroHeadingLine1: 'Premium leather,',
  heroHeadingLine2: 'made for the ukulele',
  heroSubtext:
    'Hand-stitched instrument bags from a workshop that believes the case should be worthy of what goes inside it.',
  heroImageAsset: 'photo03',

  /**
   * The brand story, supplied by the owner and used **verbatim** — punctuation,
   * em-dashes and apostrophes included. `storyLead` is the first paragraph, set
   * full width in lead style; `storyParagraphs` are the three that follow, set
   * in the column beside the image. `storyPullQuote` is an exact substring of
   * the lead, lifted out to break the column.
   */
  storyEyebrow: 'How It Started',
  storyHeading: 'Founded by Musicians, for Musicians',
  storyLead:
    "Kailo began with a simple idea and a deep love for music. Founded by an amateur ukulele player, Kailo was born from the belief that every musician deserves to carry their instrument with pride, style, and confidence. A ukulele is more than just an instrument—it's a companion, a passion, and a part of who you are. We believed its case should reflect that.",
  storyParagraphs: [
    'Leather has always been a timeless symbol of craftsmanship and style. By combining premium leather with thoughtful design, we set out to create instrument bags that not only protect your ukulele but also make a statement wherever your music takes you.',
    "Every Kailo bag is crafted with meticulous attention to detail—from the precision of every stitch to the comfort of every strap and the softness of every lining. Because we know it's the little things that make a big difference.",
    'Today, Kailo accompanies touring artists, passionate hobbyists, bedroom songwriters, and music students throughout the country, expanding its footprint to the entire world. While our community has grown, our purpose remains unchanged: to create beautifully crafted bags that protect the instruments musicians love and inspire them to carry their music with confidence.',
  ],
  storyPullQuote:
    "A ukulele is more than just an instrument—it's a companion, a passion, and a part of who you are.",
  storyChips: ['Premium leather', 'Hand-stitched', 'Ships worldwide'],
  storyImageAsset: 'photo12',
  // The old "100k+ / Musicians served" was invented. 100% hand-finished is the
  // claim the brand already makes on the homepage.
  // TODO(owner): swap in a real number — units sold, players served, years open.
  storyStatValue: '100%',
  storyStatLabel: 'Hand-finished',

  /**
   * The three the catalogue is actually filed under — the names and the `meta`
   * lines are CATEGORIES' own taglines, so nothing here claims a material the
   * shop does not sell. The bodies are house copy.
   * TODO(owner): confirm the material descriptions read true to your process.
   */
  materialsEyebrow: 'What we work in',
  materialsHeading: 'Three materials, chosen on purpose',
  materialsDescription:
    'Every Kailo bag and strap starts as one of these — picked for how they wear after a year of being carried, not for what they cost.',
  materials: [
    {
      name: 'NDM Leather',
      meta: 'Hand-stitched full-grain',
      body: 'Full-grain leather, stitched by hand. It starts firm and softens with use, settling into the shape of the instrument it carries.',
      imageAsset: 'strap-leather-brown',
    },
    {
      name: 'Suede Leather',
      meta: 'Soft from the first wear',
      body: 'Brushed to a nap that needs no breaking in, and the gentlest of the three against a lacquered finish.',
      imageAsset: 'strap-suede-tan',
    },
    {
      name: 'Denim',
      meta: 'Raw indigo, gold stitch',
      body: 'Raw indigo sewn with gold thread. It fades where it is carried, so it ages into something that is unmistakably yours.',
      imageAsset: 'strap-denim-indigo',
    },
  ],

  /** P3 of the story, broken into the three places you can feel it. */
  craftEyebrow: 'The little things',
  craftHeading: 'Where the detail lives',
  craftDescription:
    'Meticulous attention to detail is the whole job. Three places you can feel it on every bag that leaves the bench.',
  craftImageAsset: 'lifestyle-artisan',
  craftDetails: [
    {
      icon: 'Scissors',
      title: 'Every stitch',
      body: 'Precision through every seam, checked by hand before a bag is finished.',
    },
    {
      icon: 'Backpack',
      title: 'Every strap',
      body: 'Shaped and set for comfort, so a full day of carrying never feels like one.',
    },
    {
      icon: 'Layers',
      title: 'Every lining',
      body: 'Soft against a lacquered top, so nothing can mark the instrument inside.',
    },
  ],

  valuesEyebrow: 'What we stand for',
  valuesHeading: 'Mission & values',
  values: [
    {
      icon: 'Heart',
      title: 'Made with care',
      body: 'Every bag is hand-checked before it ships — no exceptions, no shortcuts.',
    },
    {
      icon: 'Sparkles',
      title: 'Materials matter',
      body: 'Full-grain and suede leather, raw denim and brushed linings, chosen to age beautifully.',
    },
    {
      icon: 'Globe',
      title: 'For the long haul',
      body: 'Designs built to travel the world with you and outlast the trends.',
    },
  ],

  audienceEyebrow: 'Who carries Kailo',
  audienceHeading: 'Made for the way you play',
  audienceDescription:
    'Touring artists, passionate hobbyists, bedroom songwriters and music students — the same bag, asked to do four very different jobs.',
  audiences: [
    {
      icon: 'Plane',
      title: 'Touring artists',
      body: 'Bags that survive a van, a stage door and an overhead locker, week after week.',
    },
    {
      icon: 'Heart',
      title: 'Passionate hobbyists',
      body: 'For the player who practises purely for the joy of it, and wants gear that feels the same way.',
    },
    {
      icon: 'Home',
      title: 'Bedroom songwriters',
      body: 'Something that looks right leaning against the wall, because that is where it lives.',
    },
    {
      icon: 'GraduationCap',
      title: 'Music students',
      body: 'Padding that forgives a crowded bus, and a strap that does not dig in on the walk to class.',
    },
  ],

  cta: {
    heading: 'Carry your music with pride',
    body: 'Explore accessories built by musicians who live out of a case and on a strap — made to move with you.',
    buttonLabel: 'Shop the Collection',
    buttonHref: '/products',
    secondaryButtonLabel: 'Get in touch',
    secondaryButtonHref: '/contact',
  },
};

/* ───────────────────────── contact page ───────────────────────── */

export const CONTACT_PAGE = {
  seo: {
    metaTitle: 'Contact — Kailo',
    metaDescription:
      "Get in touch with Kailo. Support, wholesale, press — we'd love to hear from you.",
    ogImageAsset: 'lifestyle-workbench',
    canonicalUrl: '/contact',
  },

  heroEyebrow: 'Contact',
  heroHeading: "Let's talk",
  heroSubtext:
    "Questions, partnerships, press — drop us a line and we'll get back within one business day.",
  heroImageAsset: 'lifestyle-workbench',

  contactDetails: [
    { icon: 'Mail', label: 'Email', value: 'hello@kailo.com' },
    { icon: 'Phone', label: 'Phone', value: '+1 (800) KAILO-01' },
    { icon: 'MapPin', label: 'Address', value: '123 Music Lane, Nashville, TN' },
    { icon: 'Clock', label: 'Hours', value: 'Mon–Fri 9AM–6PM EST' },
  ],
  formSubjects: ['General Inquiry', 'Order Support', 'Wholesale', 'Press'],

  workshopImageAsset: 'lifestyle-artisan',
  workshopLabel: 'Find us',
  workshopLocation: 'Nashville, TN',
  workshopDirectionsUrl: 'https://maps.google.com/?q=Nashville,TN',
  mapEmbedUrl: 'https://www.google.com/maps?q=Nashville,TN&output=embed',

  faqEyebrow: 'Good to know',
  faqHeading: 'Frequently asked',
  faqs: [
    {
      question: "What's your return policy?",
      answer: '30-day no-questions-asked returns on unused products.',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes — we ship to 40+ countries in 3-7 business days.',
    },
    {
      question: 'Are products covered by warranty?',
      answer: 'Every Kailo product carries a 2-year manufacturing warranty.',
    },
    {
      question: 'Do you offer wholesale pricing?',
      answer: 'Yes. Email wholesale@kailo.com for our trade catalogue.',
    },
    {
      question: 'Can I track my order?',
      answer: "You'll receive a tracking link by email as soon as it ships.",
    },
  ],

  cta: {
    heading: 'Prefer to talk it through?',
    body: 'Our team is around Monday to Friday, 9AM–6PM EST. Call us or drop an email — a real person will always reply.',
    buttonLabel: 'hello@kailo.com',
    buttonHref: 'mailto:hello@kailo.com',
    secondaryButtonLabel: 'Call us',
    secondaryButtonHref: 'tel:+18005245601',
  },
};

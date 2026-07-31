/**
 * Typed REST client for the Strapi 5 CMS in `kalio-backend`.
 *
 * Three things worth knowing before reading on:
 *
 * 1. **Every response is wrapped** in `{ data, meta }`. `strapiFetch` unwraps it
 *    and hands back `data`; `strapiFetchList` also returns `meta` for pagination.
 *    Strapi 5 flattens entity attributes onto the entity itself, so there is no
 *    `data.attributes` nesting to undo — the shapes here mirror the payload.
 *
 * 2. **`populate` is usually unnecessary.** A server middleware
 *    (`kalio-backend/src/middlewares/default-populate.ts`) fills in a full
 *    per-endpoint populate whenever the query omits one, and accepts
 *    `?populate=deep` as an explicit alias. Pass `populate` only to fetch *less*.
 *
 * 3. **Media URLs are root-relative** on the local upload provider
 *    (`/uploads/hero1.png`) and absolute once the provider becomes S3 or
 *    Cloudinary. `mediaUrl` handles both.
 */

import { resolveSnapshot } from "./cms-snapshot";

/**
 * With no VITE_STRAPI_URL there is no CMS to call, so reads come from the
 * snapshot in `cms-snapshot/` instead — see the note there.
 *
 * This is why the variable has no localhost default. One used to live here, and
 * because `import.meta.env` is inlined at build time, a deploy that forgot to set
 * the variable shipped `http://localhost:1337` into production and 500'd on every
 * route. Falling back to real content is the honest failure mode; pointing at a
 * host that cannot exist in production is not.
 */
export const CMS_IS_STATIC = !import.meta.env.VITE_STRAPI_URL;

/**
 * Base origin of the CMS, without a trailing slash — and `""` in static mode, so
 * the root-relative upload URLs in the snapshot resolve against this site.
 */
export const STRAPI_URL = (import.meta.env.VITE_STRAPI_URL ?? "").replace(/\/+$/, "");

/* ──────────────────────────── payload types ──────────────────────────── */

/** One of the derived sizes Strapi generates for an upload. */
export type StrapiMediaFormat = {
  url: string;
  width: number;
  height: number;
  mime?: string;
};

export type StrapiMedia = {
  id: number;
  url: string;
  name?: string;
  alternativeText: string | null;
  caption?: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, StrapiMediaFormat> | null;
};

/** Largest to smallest, for the graceful fallback in `mediaUrl`. */
export type StrapiMediaFormatName = "large" | "medium" | "small" | "thumbnail";

export type StrapiSeo = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: StrapiMedia | null;
  canonicalUrl: string | null;
} | null;

export type StrapiCta = {
  heading: string | null;
  body: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
  secondaryButtonLabel: string | null;
  secondaryButtonHref: string | null;
} | null;

/** `shared.feature` — used by "Why Kailo" and the About values grid. */
export type StrapiFeature = {
  icon: string;
  title: string;
  body: string;
};

export type StrapiNavLink = { label: string; href: string };

export type StrapiPagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type StrapiEnvelope<T> = { data: T; meta?: { pagination?: StrapiPagination } };

/* ──────────────────────────────── reads ──────────────────────────────── */

/** Thrown for any non-2xx read. Carries the status so callers can branch. */
export class StrapiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, detail: string) {
    super(`Strapi ${status} on ${path}${detail ? `: ${detail}` : ""}`);
    this.name = "StrapiError";
    this.status = status;
    this.path = path;
  }
}

/** Pulls the human-readable message out of Strapi's error envelope, if there is one. */
const errorDetail = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message ?? body;
  } catch {
    return body;
  }
};

/**
 * `GET {STRAPI_URL}/api{path}` → the unwrapped `data`.
 *
 * `path` must start with a slash and may carry a query string. Runs in the
 * browser and during SSR — both have a global `fetch`.
 */
export async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (CMS_IS_STATIC) {
    const snapshot = resolveSnapshot(path);
    if (!snapshot) throw new StrapiError(404, path, "not in the CMS snapshot");
    return snapshot.data as T;
  }

  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new StrapiError(res.status, path, errorDetail(await res.text()));
  }

  const json = (await res.json()) as StrapiEnvelope<T>;
  return json.data;
}

/** Like `strapiFetch`, but keeps `meta.pagination` for collection endpoints. */
export async function strapiFetchList<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T[]; pagination?: StrapiPagination }> {
  if (CMS_IS_STATIC) {
    const snapshot = resolveSnapshot(path);
    if (!snapshot) throw new StrapiError(404, path, "not in the CMS snapshot");
    return { data: (snapshot.data ?? []) as T[], pagination: snapshot.meta?.pagination };
  }

  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new StrapiError(res.status, path, errorDetail(await res.text()));
  }

  const json = (await res.json()) as StrapiEnvelope<T[]>;
  return { data: json.data ?? [], pagination: json.meta?.pagination };
}

/* ──────────────────────────────── media ──────────────────────────────── */

const FORMAT_FALLBACK: StrapiMediaFormatName[] = ["large", "medium", "small", "thumbnail"];

/** Root-relative uploads get the CMS origin; already-absolute URLs pass through. */
const absolute = (url: string): string =>
  /^(https?:)?\/\//.test(url) || url.startsWith("data:") ? url : `${STRAPI_URL}${url}`;

/**
 * Absolute URL for a Strapi media object, or `""` when there is no image (so it
 * can go straight into `src` without a null check).
 *
 * `format` picks a derived size and degrades gracefully: the requested size, then
 * progressively smaller ones, then the original. Strapi only generates formats
 * for images above each threshold, so a small upload may only have the original.
 */
export const mediaUrl = (
  media: StrapiMedia | null | undefined,
  format?: StrapiMediaFormatName,
): string => {
  if (!media?.url) return "";
  if (!format || !media.formats) return absolute(media.url);

  const from = FORMAT_FALLBACK.indexOf(format);
  const candidates = from === -1 ? FORMAT_FALLBACK : FORMAT_FALLBACK.slice(from);

  for (const name of candidates) {
    const candidate = media.formats[name];
    if (candidate?.url) return absolute(candidate.url);
  }

  return absolute(media.url);
};

/**
 * A `srcSet` of every size Strapi holds for an image, widest last.
 *
 * Returns `undefined` when there is nothing to choose between — one candidate in a
 * `srcSet` is just a slower way to write `src`, so the caller's plain `src` wins.
 *
 * Pair it with an honest `sizes`: the browser needs to know how wide the image will
 * *render* to pick, and without `sizes` it assumes the full viewport and reaches for
 * the largest candidate every time. The widths below are real pixel widths from the
 * payload, so `sizes` is the only thing the caller has to get right.
 */
export const mediaSrcSet = (media: StrapiMedia | null | undefined): string | undefined => {
  if (!media?.url) return undefined;

  const candidates = new Map<number, string>();

  for (const format of Object.values(media.formats ?? {})) {
    if (format?.url && format.width) candidates.set(format.width, format.url);
  }
  if (media.width) candidates.set(media.width, media.url);

  if (candidates.size < 2) return undefined;

  return [...candidates.entries()]
    .sort(([a], [b]) => a - b)
    .map(([width, url]) => `${absolute(url)} ${width}w`)
    .join(", ");
};

/** `alternativeText` if the editor set one, else the caller's fallback. */
export const mediaAlt = (media: StrapiMedia | null | undefined, fallback = ""): string =>
  media?.alternativeText?.trim() || fallback;

/**
 * `sizes` values for the layouts in this app, kept in one place so a grid change
 * and its `sizes` cannot drift apart. Each mirrors the Tailwind breakpoints the
 * corresponding component actually uses.
 */
export const SIZES = {
  /** Full-bleed hero and page headers. */
  fullWidth: "100vw",
  /** Homepage best-seller card: half-width on mobile, a quarter of the 80rem shell on desktop. */
  bentoTile: "(min-width: 1024px) 20rem, 50vw",
  /** "Shop by Category" bento: half-width on mobile, a third of the shell on desktop. */
  categoryTile: "(min-width: 1024px) 25rem, 50vw",
  /** The anchor tile of that grid — two of its three columns wide. */
  categoryFeature: "(min-width: 1024px) 50rem, 100vw",
  /** Homepage gallery strip: 2 → 3 → 4 columns. */
  galleryTile: "(min-width: 1024px) 20rem, (min-width: 640px) 33vw, 50vw",
  /** /gallery masonry: 1 → 2 → 3 → 4 columns inside the 80rem shell. */
  masonry: "(min-width: 1024px) 20rem, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw",
  /** Product grid card, 1 → 2 → 3 columns. */
  productCard: "(min-width: 1280px) 24rem, (min-width: 640px) 50vw, 100vw",
  /** Product detail main image — half the shell on desktop. */
  productDetail: "(min-width: 1024px) 36rem, 100vw",
  /**
   * Half-width editorial images: brand story, about story.
   *
   * The column is really ~35.5rem on a wide screen, but this declares slightly
   * less on purpose. Strapi's breakpoints cap an image's **longest** side, so a
   * portrait upload's `large` derivative is only ~562px wide — declaring the true
   * width would miss it by a handful of pixels and pull the multi-megapixel
   * original instead (560 KB rather than 92 KB, for a 1% upscale nobody can see).
   */
  editorialHalf: "(min-width: 1024px) 34rem, 100vw",
} as const;

/* ──────────────────────────────── writes ─────────────────────────────── */

export type StrapiPostResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };

/**
 * `POST {STRAPI_URL}/api{path}` with Strapi's `{ data: … }` body envelope.
 *
 * Returns a result object rather than throwing, because the two public form
 * endpoints use status codes as part of their contract — a newsletter re-signup
 * comes back `200` with `alreadySubscribed: true`, and both endpoints answer
 * `429` with a `Retry-After` header once the rate limit trips.
 */
export async function postToStrapi<T = unknown>(
  path: string,
  data: Record<string, unknown>,
): Promise<StrapiPostResult<T>> {
  // Nothing to write to. Reported as a failure so the form shows its error and
  // points at the mailto — never a fake success for a message no one will read.
  if (CMS_IS_STATIC) {
    return { ok: false, status: 0, message: "The CMS is not connected in this deployment." };
  }

  let res: Response;

  try {
    res = await fetch(`${STRAPI_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  } catch (error) {
    // Offline, DNS failure, CORS rejection — never reached the CMS.
    return { ok: false, status: 0, message: (error as Error).message };
  }

  const body = await res.text();

  if (!res.ok) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    return {
      ok: false,
      status: res.status,
      message: errorDetail(body),
      retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    };
  }

  let payload: T;
  try {
    payload = (JSON.parse(body) as StrapiEnvelope<T>).data;
  } catch {
    payload = undefined as T;
  }

  return { ok: true, status: res.status, data: payload };
}

/* ────────────────────────────── the two forms ────────────────────────── */

/**
 * The honeypot both public endpoints check. A bot that fills it in gets a `200`
 * and nothing is written, so it never retries — which means the field has to be
 * sent explicitly empty by real submissions.
 */
export const HONEYPOT_FIELD = "company";

export type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
  /**
   * The honeypot's live value, passed through untouched — a real visitor leaves it
   * empty, and only the server knows what to do when it isn't.
   */
  company?: string;
};

/**
 * Sends the inquiry. The CMS answers 201 and the submission lands in the admin
 * panel; nothing is sent to anyone automatically.
 *
 * `handled` is server-owned and deliberately not sent.
 */
export const submitContactForm = ({ company, ...values }: ContactSubmission) =>
  postToStrapi<{ documentId: string }>("/contact-submissions", {
    ...values,
    [HONEYPOT_FIELD]: company ?? "",
  });

/*
 * The CMS also exposes `POST /api/newsletter-subscriptions` (same honeypot and
 * rate limit as the contact form), but the current design has no newsletter
 * section anywhere — see the note on `GlobalSettings.newsletter` in `queries.ts`.
 * The client for it lived here unused and was removed; rebuild it on top of
 * `postToStrapi` if a signup form is ever added.
 */

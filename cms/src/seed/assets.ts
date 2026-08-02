/**
 * Media Library ingestion for the seed.
 *
 * Two sources:
 *   • Local originals that ship with the frontend (`frontend/src/assets`).
 *     They are read **once, at seed time** — the running server never touches
 *     that folder. After seeding, the Media Library owns its own copies under
 *     `public/uploads` and cms is self-contained. Point
 *     `KAILO_ASSETS_DIR` somewhere else if your checkout is laid out
 *     differently, or if you have vendored the images.
 *   • Remote originals (the Unsplash URLs in lib/products.ts). These are
 *     downloaded and uploaded so the CMS owns them. If the network is
 *     unavailable the download is skipped and the caller records the URL in
 *     the product's `remoteImageUrl` / `remoteGalleryUrls` fallback fields.
 *
 * Every upload is keyed by a stable file `name`, so re-running the seed reuses
 * the existing Media Library entry instead of piling up duplicates.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { Core } from '@strapi/strapi';

/** Logical key → path relative to the assets root. */
export const ASSETS: Record<string, string> = {
  logo: 'logo/kailo-logo.png',

  hero1: 'gallery/hero1.png',
  hero2: 'gallery/hero2.png',
  hero3: 'gallery/hero3.png',
  hero4: 'gallery/hero4.png',

  gallery1: 'gallery/gallery1.jpeg',
  gallery3: 'gallery/gallery3.jpeg',
  gallery4: 'gallery/gallery4.jpeg',
  gallery5: 'gallery/gallery5.jpeg',
  gallery6: 'gallery/gallery6.jpeg',

  // Kailo's own product photography — the leather bags and the four straps.
  'bag-lineup-four': 'products/bag-lineup-four.png',
  'bag-showroom-trio': 'products/bag-showroom-trio.png',
  'bag-showroom-poster': 'products/bag-showroom-poster.png',
  'bag-display-table': 'products/bag-display-table.png',

  'strap-leather-brown': 'products/strap-leather-brown.png',
  'strap-suede-tan': 'products/strap-suede-tan.png',
  'strap-denim-indigo': 'products/strap-denim-indigo.png',
  'strap-denim-patchwork': 'products/strap-denim-patchwork.png',

  'lifestyle-artisan': 'lifestyle/artisan.png',
  'lifestyle-restringing': 'lifestyle/restringing.png',
  'lifestyle-ukulele-window': 'lifestyle/ukulele-window.png',
  'lifestyle-workbench': 'lifestyle/workbench.png',

  // photo01 … photo24 are added below.
};

for (let i = 1; i <= 24; i += 1) {
  const key = `photo${String(i).padStart(2, '0')}`;
  ASSETS[key] = `gallery/${key}.jpeg`;
}

/**
 * Where the original images live.
 *
 * `appRoot` must be the cms project root — NOT `__dirname`, which in
 * a built app points inside `dist/` and would resolve one level too deep.
 * Callers pass `strapi.dirs.app.root`.
 */
export const assetsRoot = (appRoot: string): string =>
  path.resolve(
    process.env.KAILO_ASSETS_DIR ?? path.join(appRoot, '..', 'frontend', 'src', 'assets')
  );

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

const mimeFor = (filePath: string): string =>
  MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';

export type UploadedFile = { id: number; name: string; url: string };

/**
 * Wraps the upload plugin and remembers what it has already put in the Media
 * Library, so a seed run touches each original at most once.
 */
export class MediaLibrary {
  private readonly cache = new Map<string, UploadedFile | null>();

  private readonly missing = new Set<string>();

  private readonly failedDownloads = new Set<string>();

  /** Resolved once, in the constructor, so every lookup agrees. */
  readonly root: string;

  constructor(private readonly strapi: Core.Strapi) {
    this.root = assetsRoot(strapi.dirs?.app?.root ?? process.cwd());
    strapi.log.info(`[seed] reading original images from ${this.root}`);
  }

  /** Assets named in the seed that were not found on disk. */
  get missingAssets(): string[] {
    return [...this.missing].sort();
  }

  /** Remote images that could not be fetched (product falls back to the URL). */
  get skippedDownloads(): string[] {
    return [...this.failedDownloads].sort();
  }

  /** Look the file up by name first — that is what makes re-seeding a no-op. */
  private async findExisting(name: string): Promise<UploadedFile | null> {
    const [existing] = await this.strapi.db.query('plugin::upload.file').findMany({
      where: { name },
      limit: 1,
    });

    return existing ? { id: existing.id, name: existing.name, url: existing.url } : null;
  }

  private async uploadFile(
    name: string,
    filePath: string,
    alternativeText: string,
    caption: string
  ): Promise<UploadedFile> {
    const stats = await fs.promises.stat(filePath);

    const uploaded = await this.strapi
      .plugin('upload')
      .service('upload')
      .upload({
        data: { fileInfo: { name, alternativeText, caption } },
        files: {
          filepath: filePath,
          originalFilename: path.basename(filePath),
          mimetype: mimeFor(filePath),
          size: stats.size,
        },
      });

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    return { id: file.id, name: file.name, url: file.url };
  }

  /** Upload a bundled frontend asset by its ASSETS key. */
  async local(key: string, alternativeText = '', caption = ''): Promise<UploadedFile | null> {
    if (this.cache.has(key)) return this.cache.get(key) ?? null;

    const relative = ASSETS[key];

    if (!relative) {
      this.strapi.log.warn(`[seed] unknown asset key "${key}"`);
      this.missing.add(key);
      this.cache.set(key, null);
      return null;
    }

    const filePath = path.join(this.root, relative);

    if (!fs.existsSync(filePath)) {
      this.strapi.log.warn(`[seed] asset not found on disk: ${filePath}`);
      this.missing.add(key);
      this.cache.set(key, null);
      return null;
    }

    const existing = await this.findExisting(key);

    if (existing) {
      this.cache.set(key, existing);
      return existing;
    }

    const file = await this.uploadFile(key, filePath, alternativeText, caption);
    this.strapi.log.info(`[seed] uploaded ${key} → ${file.url}`);
    this.cache.set(key, file);
    return file;
  }

  /**
   * Download a remote original and upload it. Returns null when the fetch
   * fails, which is the signal for the caller to keep the URL as a fallback.
   */
  async remote(url: string, alternativeText = ''): Promise<UploadedFile | null> {
    const name = remoteAssetName(url);

    if (this.cache.has(name)) return this.cache.get(name) ?? null;

    const existing = await this.findExisting(name);

    if (existing) {
      this.cache.set(name, existing);
      return existing;
    }

    let tempPath: string | null = null;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(Number(process.env.SEED_FETCH_TIMEOUT_MS ?? 20_000)),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      const extension = contentType.includes('png') ? '.png' : '.jpg';
      const buffer = Buffer.from(await response.arrayBuffer());

      tempPath = path.join(
        await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kailo-seed-')),
        `${name}${extension}`
      );
      await fs.promises.writeFile(tempPath, buffer);

      const file = await this.uploadFile(name, tempPath, alternativeText, '');
      this.strapi.log.info(`[seed] downloaded + uploaded ${name} → ${file.url}`);
      this.cache.set(name, file);
      return file;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.strapi.log.warn(
        `[seed] could not fetch ${url} (${reason}) — keeping it as a remoteImageUrl fallback`
      );
      this.failedDownloads.add(url);
      this.cache.set(name, null);
      return null;
    } finally {
      if (tempPath) {
        await fs.promises.rm(path.dirname(tempPath), { recursive: true, force: true });
      }
    }
  }
}

/**
 * A stable, readable Media Library name for a remote original:
 *   https://images.unsplash.com/photo-1510915361894-db8b60106cb1?…&sig=2
 *     → unsplash-photo-1510915361894-db8b60106cb1-sig2
 */
export const remoteAssetName = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.split('.').slice(-2, -1)[0] ?? 'remote';
    const slug = parsed.pathname.replace(/^\/+/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
    const sig = parsed.searchParams.get('sig');

    return [host, slug, sig ? `sig${sig}` : null].filter(Boolean).join('-');
  } catch {
    return `remote-${Buffer.from(url).toString('base64url').slice(0, 24)}`;
  }
};

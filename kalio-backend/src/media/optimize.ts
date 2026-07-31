/**
 * Converts the media library to WebP.
 *
 * Strapi's own breakpoints do not help image weight when the source is a PNG —
 * sharp re-encodes PNG as PNG, which is why `large_hero1.png` (1.5 MB) came out
 * *larger* than the 1.1 MB original it was derived from. The fix is a format
 * change, and since Strapi never re-derives on read, the cheapest place to do it is
 * once, over the files that already exist.
 *
 * For each raster upload this encodes a WebP of the original and of every
 * derivative, writes them **alongside** the source files, and repoints the row in
 * `files` at the new URLs. Nothing is deleted, so restoring the `url` / `ext` /
 * `mime` / `size` / `formats` columns undoes the whole migration.
 *
 * Content is never touched. Relations key on file IDs, and the IDs do not change,
 * so prices, copy and hand-edits in the admin all survive.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Core } from '@strapi/strapi';
import sharp from 'sharp';

/** Visually lossless for photography at roughly a third of the bytes. */
const WEBP_QUALITY = 80;

/** sharp's default is 4; 5 buys a few percent for a one-off migration. */
const WEBP_EFFORT = 5;

const FILE_MODEL = 'plugin::upload.file';

/** Strapi records `size` in kilobytes, as a float. */
const toKb = (bytes: number): number => Number((bytes / 1024).toFixed(2));

type StrapiFormat = {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
};

type StrapiFile = {
  id: number;
  name: string;
  hash: string;
  ext: string | null;
  mime: string;
  url: string;
  width: number | null;
  height: number | null;
  size: number | null;
  formats: Record<string, StrapiFormat> | null;
  provider: string;
};

export type OptimizeOptions = {
  /** Without this nothing is written and no row is updated. */
  apply: boolean;
};

type Outcome =
  | { kind: 'converted'; file: StrapiFile; before: number; after: number; variants: number }
  | { kind: 'skipped'; file: StrapiFile; reason: string };

/** Root that `/uploads/...` URLs resolve against on the local provider. */
const publicDir = () => path.join(process.cwd(), 'public');

const localPath = (url: string): string => path.join(publicDir(), url.replace(/^\//, ''));

/**
 * SVGs are already small and would be rasterised; anything already WebP is done.
 * Non-images (PDFs, video) are not this script's business.
 */
const skipReason = (file: StrapiFile): string | null => {
  if (file.provider !== 'local') return `provider is "${file.provider}"`;
  if (!file.mime?.startsWith('image/')) return `not an image (${file.mime})`;
  if (file.mime === 'image/svg+xml') return 'svg';
  if (file.mime === 'image/webp') return 'already webp';
  if (!file.url?.startsWith('/uploads/')) return `unexpected url (${file.url})`;
  return null;
};

type Encoded = { bytes: Buffer; url: string; hash: string; targetPath: string };

/**
 * Encodes one source file to WebP in memory.
 *
 * The hash is reused so the WebP lands beside its source as `{hash}.webp` — no
 * collision with `{hash}.png`, and the pairing stays obvious on disk.
 */
const encode = async (url: string, hash: string): Promise<Encoded | null> => {
  const source = localPath(url);
  if (!existsSync(source)) return null;

  const input = await readFile(source);
  const bytes = await sharp(input)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toBuffer();

  return {
    bytes,
    url: `/uploads/${hash}.webp`,
    hash,
    targetPath: path.join(publicDir(), 'uploads', `${hash}.webp`),
  };
};

const optimizeFile = async (
  strapi: Core.Strapi,
  file: StrapiFile,
  options: OptimizeOptions
): Promise<Outcome> => {
  const skip = skipReason(file);
  if (skip) return { kind: 'skipped', file, reason: skip };

  const original = await encode(file.url, file.hash);
  if (!original) return { kind: 'skipped', file, reason: 'file missing on disk' };

  const formats = file.formats ?? {};
  const encodedFormats: Record<string, { format: StrapiFormat; encoded: Encoded }> = {};

  for (const [name, format] of Object.entries(formats)) {
    if (!format?.url || !format.hash) continue;
    const encoded = await encode(format.url, format.hash);
    // A derivative whose file went missing is dropped from `formats` rather than
    // left pointing at a URL that will 404 after the original moves.
    if (encoded) encodedFormats[name] = { format, encoded };
  }

  const beforeBytes =
    (file.size ?? 0) * 1024 +
    Object.values(formats).reduce(
      (total, format) => total + (format.sizeInBytes ?? format.size * 1024),
      0
    );

  const afterBytes =
    original.bytes.length +
    Object.values(encodedFormats).reduce((total, { encoded }) => total + encoded.bytes.length, 0);

  if (options.apply) {
    await writeFile(original.targetPath, original.bytes);
    for (const { encoded } of Object.values(encodedFormats)) {
      await writeFile(encoded.targetPath, encoded.bytes);
    }

    const nextFormats: Record<string, StrapiFormat> = {};
    for (const [name, { format, encoded }] of Object.entries(encodedFormats)) {
      nextFormats[name] = {
        ...format,
        ext: '.webp',
        mime: 'image/webp',
        url: encoded.url,
        hash: encoded.hash,
        size: toKb(encoded.bytes.length),
        sizeInBytes: encoded.bytes.length,
      };
    }

    await strapi.db.query(FILE_MODEL).update({
      where: { id: file.id },
      data: {
        ext: '.webp',
        mime: 'image/webp',
        url: original.url,
        hash: original.hash,
        size: toKb(original.bytes.length),
        // WebP preserves pixel dimensions, so width/height are deliberately left
        // as they are.
        formats: Object.keys(nextFormats).length > 0 ? nextFormats : null,
      },
    });
  }

  return {
    kind: 'converted',
    file,
    before: beforeBytes,
    after: afterBytes,
    variants: 1 + Object.keys(encodedFormats).length,
  };
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

const PAGE_SIZE = 200;

/**
 * Every row in `files`, paged.
 *
 * `limit: -1` reaches Postgres verbatim and errors ("LIMIT must not be negative"),
 * so the whole table is walked in explicit pages instead.
 */
const allFiles = async (strapi: Core.Strapi): Promise<StrapiFile[]> => {
  const collected: StrapiFile[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = (await strapi.db.query(FILE_MODEL).findMany({
      orderBy: { id: 'asc' },
      limit: PAGE_SIZE,
      offset,
    })) as StrapiFile[];

    collected.push(...page);
    if (page.length < PAGE_SIZE) return collected;
  }
};

export const optimizeMedia = async (
  strapi: Core.Strapi,
  options: OptimizeOptions
): Promise<void> => {
  const provider = strapi.config.get('plugin::upload.provider', 'local');
  if (provider !== 'local') {
    strapi.log.warn(
      `[media] upload provider is "${provider}" — this script only rewrites local files. ` +
        'Transformation is the provider\'s job once assets live remotely.'
    );
    return;
  }

  const files = await allFiles(strapi);

  strapi.log.info(
    `[media] ${files.length} files in the library — ${options.apply ? 'converting' : 'dry run, nothing will be written'}`
  );

  const converted: Extract<Outcome, { kind: 'converted' }>[] = [];
  const skipped: Extract<Outcome, { kind: 'skipped' }>[] = [];

  for (const file of files) {
    try {
      const outcome = await optimizeFile(strapi, file, options);
      if (outcome.kind === 'converted') {
        converted.push(outcome);
        const saving = Math.round((1 - outcome.after / outcome.before) * 100);
        strapi.log.info(
          `[media] ${file.name}: ${kb(outcome.before)} → ${kb(outcome.after)} (−${saving}%, ${outcome.variants} variants)`
        );
      } else {
        skipped.push(outcome);
      }
    } catch (error) {
      // One unreadable file must not strand the rest of the library half-migrated.
      skipped.push({ kind: 'skipped', file, reason: `sharp failed: ${(error as Error).message}` });
    }
  }

  const before = converted.reduce((total, outcome) => total + outcome.before, 0);
  const after = converted.reduce((total, outcome) => total + outcome.after, 0);

  strapi.log.info('[media] ─────────────────────────────────');
  strapi.log.info(`[media] converted  ${converted.length} files`);
  strapi.log.info(`[media] skipped    ${skipped.length} files`);

  if (converted.length > 0) {
    const saving = Math.round((1 - after / before) * 100);
    strapi.log.info(`[media] before     ${mb(before)}`);
    strapi.log.info(`[media] after      ${mb(after)}`);
    strapi.log.info(`[media] saving     ${mb(before - after)} (−${saving}%)`);
  }

  // Group the skips so "already webp" on a second run reads as success, not noise.
  const reasons = skipped.reduce<Record<string, number>>((counts, outcome) => {
    counts[outcome.reason] = (counts[outcome.reason] ?? 0) + 1;
    return counts;
  }, {});
  for (const [reason, count] of Object.entries(reasons)) {
    strapi.log.info(`[media] skipped:   ${count} × ${reason}`);
  }

  if (!options.apply && converted.length > 0) {
    strapi.log.info('[media] re-run with `-- --apply` to write these files and update the library');
  }
};

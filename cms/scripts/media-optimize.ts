/**
 * Standalone media optimiser: `npm run media:optimize [-- --apply]`.
 *
 * Boots a headless Strapi instance (no HTTP server) so the upload plugin's config
 * and the `files` table are available, converts the library to WebP, then exits.
 *
 * Dry run by default — nothing is written and no row is updated until `--apply`.
 * Safe to re-run: see src/media/optimize.ts for the idempotency rules.
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';

import { optimizeMedia } from '../src/media/optimize';

const main = async (): Promise<void> => {
  const apply = process.argv.includes('--apply');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  try {
    await optimizeMedia(app, { apply });
  } finally {
    await app.destroy();
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[media] failed');
    console.error(error);
    process.exit(1);
  });

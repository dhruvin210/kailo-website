/**
 * Standalone seed runner: `npm run seed`.
 *
 * Boots a headless Strapi instance (no HTTP server), runs the same seed the
 * first-boot bootstrap uses, then exits. Safe to run against a database that
 * is already seeded — see src/seed/index.ts for the idempotency rules.
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';

import { runSeed } from '../src/seed';
import { configurePublicRole } from '../src/seed/permissions';

const main = async (): Promise<void> => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  try {
    await configurePublicRole(app);
    await runSeed(app);
  } finally {
    await app.destroy();
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] failed');
    console.error(error);
    process.exit(1);
  });

import type { Core } from '@strapi/strapi';

import { runSeedOnce } from './seed';
import { configurePublicRole } from './seed/permissions';

export default {
  /**
   * Runs before the application is initialised — nothing to extend here yet.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Runs once the app is ready, on every boot.
   *
   *  • Public-role permissions are reconciled every time, so the API surface
   *    is defined in code rather than in whoever-clicked-what.
   *  • Content is seeded only when the database has never been seeded at this
   *    SEED_VERSION. Set SEED_ON_BOOT=false to opt out and drive it manually
   *    with `npm run seed`.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await configurePublicRole(strapi);

    try {
      await runSeedOnce(strapi);
    } catch (error) {
      // A failed seed must not stop the server from coming up — the admin
      // panel is how you would diagnose it.
      strapi.log.error('[seed] first-boot seed failed; run `npm run seed` to retry');
      strapi.log.error(error);
    }
  },
};

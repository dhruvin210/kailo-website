/**
 * Public-role permissions, applied on every boot so a fresh clone + fresh
 * database reaches the right state without anyone clicking through
 * Settings → Roles → Public.
 *
 * Read access covers the content the site renders. Write access is the newsletter
 * and contact forms (`create` only) plus the cart's three token-scoped routes.
 * Nothing grants the Public role `find` on submissions or on carts, so form
 * captures are not readable over the API; admins read them in the panel.
 */
import type { Core } from '@strapi/strapi';

/** action → whether the Public role should be able to call it. */
type ActionMap = Record<string, boolean>;

const READ_ONLY: ActionMap = { find: true, findOne: true, create: false, update: false, delete: false };

/** Single types expose `find` only — there is no findOne route for them. */
const SINGLE_TYPE: ActionMap = { find: true, update: false, delete: false };

const CREATE_ONLY: ActionMap = {
  find: false,
  findOne: false,
  create: true,
  update: false,
  delete: false,
};

/**
 * The cart's three token-scoped custom actions, and the core five spelled out as
 * `false`.
 *
 * `src/api/cart/routes/cart.ts` never declares the core routes, so those five do
 * not exist to grant — the loop below skips any action Strapi did not register.
 * They are listed anyway as a standing assertion: if someone later swaps in
 * `createCoreRouter`, this file revokes `find` and `delete` on the next boot
 * instead of quietly leaving every cart in the database readable at `/api/carts`.
 */
const CART_TOKEN_SCOPED: ActionMap = {
  find: false,
  findOne: false,
  create: false,
  update: false,
  delete: false,
  upsertByToken: true,
  findByToken: true,
  markRecovered: true,
};

export const PUBLIC_PERMISSIONS: Record<string, ActionMap> = {
  'api::product.product': READ_ONLY,
  'api::category.category': READ_ONLY,
  'api::gallery-image.gallery-image': READ_ONLY,

  'api::home-page.home-page': SINGLE_TYPE,
  'api::about-page.about-page': SINGLE_TYPE,
  'api::contact-page.contact-page': SINGLE_TYPE,
  'api::global.global': SINGLE_TYPE,

  'api::newsletter-subscription.newsletter-subscription': CREATE_ONLY,
  'api::contact-submission.contact-submission': CREATE_ONLY,
  'api::cart.cart': CART_TOKEN_SCOPED,
};

export const configurePublicRole = async (strapi: Core.Strapi): Promise<void> => {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[permissions] no Public role found — skipping');
    return;
  }

  let granted = 0;
  let revoked = 0;

  for (const [uid, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
    for (const [action, enabled] of Object.entries(actions)) {
      const permissionAction = `${uid}.${action}`;

      // Only touch actions Strapi actually registered — a content type without
      // a `findOne` route has no such permission row to create.
      const known = strapi.contentAPI?.permissions?.providers?.action?.get(permissionAction);
      if (!known) continue;

      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: permissionAction, role: publicRole.id },
      });

      if (enabled && !existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action: permissionAction, role: publicRole.id },
        });
        granted += 1;
      } else if (!enabled && existing) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .delete({ where: { id: existing.id } });
        revoked += 1;
      }
    }
  }

  if (granted > 0 || revoked > 0) {
    strapi.log.info(`[permissions] Public role: +${granted} granted, -${revoked} revoked`);
  } else {
    strapi.log.debug('[permissions] Public role already correct');
  }
};

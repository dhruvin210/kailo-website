import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ValidationError } = errors;

const UID = 'api::newsletter-subscription.newsletter-subscription' as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default factories.createCoreController(UID, ({ strapi }) => ({
  /**
   * Public write. `email` is unique, so a repeat sign-up would otherwise 400 —
   * which reads as an error to the visitor even though nothing is wrong. We
   * detect the duplicate up front and answer 200 with `alreadySubscribed`.
   */
  async create(ctx) {
    const body = (ctx.request.body as { data?: Record<string, unknown> })?.data ?? {};

    const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const source =
      typeof body.source === 'string' && body.source.trim() !== ''
        ? body.source.trim()
        : 'home-newsletter';

    if (!EMAIL.test(email)) {
      throw new ValidationError('Please enter a valid email.');
    }

    const existing = await strapi.documents(UID).findFirst({ filters: { email } });

    if (existing) {
      ctx.status = 200;
      ctx.body = { data: { alreadySubscribed: true }, meta: {} };
      return;
    }

    const entry = await strapi.documents(UID).create({ data: { email, source } });

    strapi.log.info(`[newsletter] new subscriber ${email} (${source})`);

    ctx.status = 201;
    ctx.body = { data: { documentId: entry.documentId, alreadySubscribed: false }, meta: {} };
  },
}));

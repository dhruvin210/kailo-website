import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ValidationError } = errors;

const UID = 'api::contact-submission.contact-submission' as const;

/**
 * The enquiry types the form offers, and the allowlist a submission is checked
 * against. Must stay in sync with `SUBJECTS` in the frontend's `contact.tsx` and
 * with `CONTACT_PAGE.formSubjects` in the seed.
 *
 * Anything else is stored as `DEFAULT_SUBJECT` rather than rejected: a stale
 * cached page posting a retired subject should still get its message through.
 */
const SUBJECTS = [
  'Product Enquiry',
  'Custom Order',
  'Wholesale Enquiry',
  'Collaboration',
  'Order Support',
  'General Enquiry',
] as const;

/**
 * Named rather than `SUBJECTS[0]`, which is what this used to be. The list is
 * ordered for the form, so the first entry is the most common enquiry — filing an
 * unrecognised subject under "Product Enquiry" would invent a claim about it.
 */
const DEFAULT_SUBJECT = 'General Enquiry';

/** Generous, and only here so a runaway client cannot post a novel as a number. */
const PHONE_MAX = 32;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export default factories.createCoreController(UID, ({ strapi }) => ({
  /**
   * Public write. Deliberately not the core `create` — that would let anyone set
   * `handled`, and would echo the stored record back. We accept exactly the
   * form's fields and answer with a bare acknowledgement.
   *
   * Nothing is sent anywhere: the submission is a record in the admin panel, and
   * whoever is watching the panel replies by hand.
   */
  async create(ctx) {
    const body = (ctx.request.body as { data?: Record<string, unknown> })?.data ?? {};

    const name = asTrimmedString(body.name);
    const email = asTrimmedString(body.email).toLowerCase();
    const message = asTrimmedString(body.message);
    const requestedSubject = asTrimmedString(body.subject);
    // Optional, and stored exactly as typed — reformatting someone's number is a
    // good way to make it undiallable. The only rule is a length ceiling.
    const phone = asTrimmedString(body.phone).slice(0, PHONE_MAX);

    if (name.length < 2) {
      throw new ValidationError('Please enter your name.');
    }
    if (!EMAIL.test(email)) {
      throw new ValidationError('Please enter a valid email.');
    }
    if (message.length < 20) {
      throw new ValidationError('Message should be at least 20 characters.');
    }

    const subject = (SUBJECTS as readonly string[]).includes(requestedSubject)
      ? requestedSubject
      : DEFAULT_SUBJECT;

    const entry = await strapi.documents(UID).create({
      // Omitted rather than stored as "" so the admin list shows an empty cell
      // instead of a blank that reads as a value. `undefined`, not `null` — the
      // generated document type does not accept null for an optional string.
      data: { name, email, phone: phone || undefined, subject, message, handled: false },
    });

    strapi.log.info(`[contact] new submission from ${email} (${subject})`);

    ctx.status = 201;
    ctx.body = { data: { documentId: entry.documentId }, meta: {} };
  },
}));

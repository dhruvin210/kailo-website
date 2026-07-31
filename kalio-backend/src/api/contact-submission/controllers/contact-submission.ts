import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ValidationError } = errors;

const UID = 'api::contact-submission.contact-submission' as const;

/** Subjects the frontend select offers. Anything else falls back to the first. */
const SUBJECTS = ['General Inquiry', 'Order Support', 'Wholesale', 'Press'] as const;

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
      : SUBJECTS[0];

    const entry = await strapi.documents(UID).create({
      data: { name, email, subject, message, handled: false },
    });

    strapi.log.info(`[contact] new submission from ${email} (${subject})`);

    ctx.status = 201;
    ctx.body = { data: { documentId: entry.documentId }, meta: {} };
  },
}));

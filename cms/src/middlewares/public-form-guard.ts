/**
 * Spam control for every publicly writable endpoint.
 *
 * Two cheap, dependency-free defences:
 *
 *   1. Honeypot — the frontend renders a visually-hidden `company` field.
 *      Humans leave it empty; most bots fill every input they find. A filled
 *      honeypot gets a 200 with no record written, so the bot sees success and
 *      does not retry. Forms only: the cart sync is not a form and has no such
 *      field to check.
 *   2. Per-IP fixed-window throttle, answered with 429 once exceeded.
 *
 * The two kinds of endpoint need very different limits, which is why the rules
 * below are a table rather than one pair of numbers. A contact form submitted six
 * times in a minute is a bot; a cart PUT sent sixty times in a minute is one
 * shopper adjusting quantities behind a 1.5-second debounce. Sharing a budget
 * between them would either wave the bot through or break the cart.
 *
 * The counter lives in this process's memory. That is the right trade for a
 * single-instance deploy; behind a load balancer or on more than one dyno, move it
 * to Redis (or put the rate limit on the CDN/WAF) — see README.
 */
import type { Core } from '@strapi/strapi';

/** The hidden field name; must match what the frontend forms render. */
export const HONEYPOT_FIELD = 'company';

type Rule = {
  /** Requests allowed per window, per IP, per matched path. */
  max: number;
  windowMs: number;
  /** Whether a filled `company` field short-circuits with a 200. */
  honeypot: boolean;
  /** Wording for the 429. */
  noun: string;
};

type Window = { count: number; expiresAt: number };

const hits = new Map<string, Window>();

/** Drop expired windows so the map cannot grow without bound. */
const sweep = (now: number): void => {
  for (const [key, window] of hits) {
    if (window.expiresAt <= now) hits.delete(key);
  }
};

let lastSweep = 0;
/** Longest window in play, so the amortised sweep cannot run ahead of it. */
let sweepEvery = 60_000;

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const formWindowMs = Number(process.env.PUBLIC_FORM_WINDOW_MS ?? 60_000);
  const formMax = Number(process.env.PUBLIC_FORM_MAX_SUBMISSIONS ?? 5);
  const cartWindowMs = Number(process.env.CART_WRITE_WINDOW_MS ?? 60_000);
  const cartMax = Number(process.env.CART_WRITE_MAX ?? 60);

  const forms: Rule = {
    max: formMax,
    windowMs: formWindowMs,
    honeypot: true,
    noun: 'submissions',
  };

  const carts: Rule = {
    max: cartMax,
    windowMs: cartWindowMs,
    honeypot: false,
    noun: 'cart updates',
  };

  sweepEvery = Math.max(formWindowMs, cartWindowMs);

  /**
   * Path → rule. Exact matches for the two forms; a prefix for the cart, whose
   * paths carry a token (`/api/carts/token/<uuid>`) and so cannot be enumerated.
   *
   * The rate-limit key uses the *matched pattern*, not the request path — keying
   * on the path itself would give every fresh token its own budget, which is no
   * limit at all.
   */
  const ruleFor = (method: string, path: string): { rule: Rule; key: string } | null => {
    if (method === 'POST' && path === '/api/contact-submissions') {
      return { rule: forms, key: path };
    }
    if (method === 'POST' && path === '/api/newsletter-subscriptions') {
      return { rule: forms, key: path };
    }
    if ((method === 'PUT' || method === 'POST') && path.startsWith('/api/carts/')) {
      return { rule: carts, key: '/api/carts' };
    }
    return null;
  };

  return async (ctx: any, next: () => Promise<void>) => {
    const path = ctx.path.endsWith('/') ? ctx.path.slice(0, -1) : ctx.path;

    const matched = ruleFor(ctx.method, path);
    if (!matched) return next();

    const { rule, key: ruleKey } = matched;

    if (rule.honeypot) {
      const data = ctx.request.body?.data ?? {};

      if (typeof data[HONEYPOT_FIELD] === 'string' && data[HONEYPOT_FIELD].trim() !== '') {
        strapi.log.warn(`[public-form-guard] honeypot tripped on ${path} from ${ctx.ip}`);
        ctx.status = 200;
        ctx.body = { data: null, meta: {} };
        return;
      }
    }

    const now = Date.now();

    // Amortised cleanup — at most once per longest window, not on every request.
    if (now - lastSweep > sweepEvery) {
      sweep(now);
      lastSweep = now;
    }

    const key = `${ctx.ip}:${ruleKey}`;
    const window = hits.get(key);

    if (!window || window.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + rule.windowMs });
    } else if (window.count >= rule.max) {
      const retryAfter = Math.ceil((window.expiresAt - now) / 1000);
      ctx.set('Retry-After', String(retryAfter));
      return ctx.tooManyRequests(
        `Too many ${rule.noun}. Please try again in ${retryAfter} second(s).`
      );
    } else {
      window.count += 1;
    }

    return next();
  };
};

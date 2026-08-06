/**
 * CORS origins come from env so a deploy never needs a code change:
 *
 *   FRONTEND_URL       primary origin (the storefront's public URL in prod)
 *   FRONTEND_URLS      optional comma-separated list of extra origins
 *
 * The defaults cover the TanStack Start dev server, which `frontend`
 * pins to port 8080 in its vite.config.ts, plus the conventional 3000/5173.
 */
const DEV_ORIGINS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/**
 * Hosts allowed to serve images and media, beyond this origin.
 *
 * Enabling a remote upload provider moves every asset off `'self'`, so the CDN has
 * to be listed here or the admin's media library fills with broken thumbnails.
 * `CDN_URL` is the same var the S3 provider uses for its `baseUrl`; `CDN_HOSTS`
 * takes a comma-separated list for anything else (a second bucket, Cloudinary's
 * `res.cloudinary.com`, a legacy origin mid-migration).
 */
const mediaHosts = (env: any): string[] => {
  const raw = [env('CDN_URL', ''), ...env.array('CDN_HOSTS', [])];

  const hosts = raw
    .map((value: string) => value.trim())
    .filter(Boolean)
    .map((value: string) => {
      // CSP wants a host, not a URL — strip the scheme and any path if the value
      // was pasted in as a full origin.
      try {
        return new URL(value.includes('//') ? value : `https://${value}`).host;
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  return Array.from(new Set([...hosts, 'market-assets.strapi.io']));
};

export default ({ env }) => {
  const extra = env
    .array('FRONTEND_URLS', [])
    .map((value: string) => value.trim())
    .filter(Boolean);

  const origin = Array.from(
    new Set([env('FRONTEND_URL', 'http://localhost:8080'), ...extra, ...DEV_ORIGINS])
  );

  const media = mediaHosts(env);

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            // Uploaded media is served from this origin on the local provider, and
            // from CDN_URL / CDN_HOSTS once a remote provider is enabled.
            'img-src': ["'self'", 'data:', 'blob:', ...media],
            'media-src': ["'self'", 'data:', 'blob:', ...media],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        origin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        keepHeaderOnError: true,
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    // Must sit after strapi::query so ctx.query is already parsed.
    'global::default-populate',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
    // Spam control for the two publicly writable endpoints. Must sit after
    // strapi::body so the honeypot field is parsed and visible.
    'global::public-form-guard',
  ];
};

export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // PUBLIC_URL matters once media is served from behind a proxy/CDN — Strapi
  // uses it to build absolute upload URLs.
  url: env('PUBLIC_URL', undefined),
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

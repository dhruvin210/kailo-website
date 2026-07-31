import path from 'path';

/**
 * PostgreSQL only. Two ways to point Strapi at a database:
 *
 *   1. Discrete vars — DATABASE_HOST / _PORT / _NAME / _USERNAME / _PASSWORD.
 *      This is what `docker-compose.yml` and a local Postgres install use.
 *   2. DATABASE_URL — a single connection string. Hosted providers
 *      (Render, Railway, Supabase, Neon, Heroku) hand you one of these; when
 *      it is set it wins, and the discrete vars are ignored.
 *
 * Hosted Postgres almost always terminates TLS with a certificate Node does
 * not trust, so `DATABASE_SSL=true` deliberately pairs with
 * `rejectUnauthorized: false` unless you supply a CA via DATABASE_SSL_CA.
 */
export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');

  if (client !== 'postgres') {
    throw new Error(
      `kalio-backend is PostgreSQL-only, but DATABASE_CLIENT is "${client}". ` +
        'Set DATABASE_CLIENT=postgres (see .env.example).'
    );
  }

  const ssl = env.bool('DATABASE_SSL', false)
    ? {
        key: env('DATABASE_SSL_KEY', undefined),
        cert: env('DATABASE_SSL_CERT', undefined),
        ca: env('DATABASE_SSL_CA', undefined),
        capath: env('DATABASE_SSL_CAPATH', undefined),
        cipher: env('DATABASE_SSL_CIPHER', undefined),
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
      }
    : false;

  const connectionString = env('DATABASE_URL');

  const connection = connectionString
    ? { connectionString, ssl }
    : {
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'kailo'),
        user: env('DATABASE_USERNAME', 'kailo'),
        password: env('DATABASE_PASSWORD', 'kailo'),
        ssl,
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  return {
    connection: {
      client: 'postgres',
      connection,
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      // Hand-written SQL lives here if we ever need it; Strapi manages its own
      // schema, so this stays empty in normal operation.
      migrations: { dir: path.join(__dirname, '..', 'database', 'migrations') },
    },
  };
};

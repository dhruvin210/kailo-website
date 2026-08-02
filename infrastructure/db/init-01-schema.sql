-- Kailo — PostgreSQL initialisation.
--
-- Mounted at /docker-entrypoint-initdb.d by docker-compose.yml and run by the
-- postgres image ONCE, while the data directory is still empty. On an existing
-- volume it does not run at all, so editing this file changes nothing until the
-- next `docker compose down -v`. It runs as the superuser created from
-- POSTGRES_USER, against the POSTGRES_DB database.
--
-- Deliberately minimal. Strapi owns its own schema — it creates and migrates
-- every table from the content types in cms/src/api/**/schema.json on boot, so
-- anything declared here that Strapi also manages would be fighting it. No
-- CREATE/GRANT on the public schema is needed either: the CMS connects as the
-- same role this script runs as.

-- Case- and accent-insensitive matching for product and gallery lookups.
-- pg_trgm also backs trigram indexes, which is the cheap path to a usable
-- "search products" endpoint whenever that lands. Both ship with the official
-- image, and neither costs anything until something references them.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- A timezone-stable default. Strapi writes timestamptz, so this only changes
-- how values render in a psql session — but a dump read back in a different
-- zone is exactly the confusion docs/backup-recovery.md exists to prevent.
--
-- ALTER DATABASE requires a literal name and this file cannot see POSTGRES_DB,
-- so the name is looked up and injected. `ALTER DATABASE ... SET` is
-- transaction-safe, which makes a DO block a legal home for it.
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'UTC');
END
$$;

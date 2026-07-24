# Kalio Backend

Reserved for the Kalio backend (API server, database, business logic).

The current project is **frontend-only** — a TanStack Start SSR app that now lives
in [`../kalio-frontend`](../kalio-frontend). The SSR "server" entry there
(`src/server.ts`) only bootstraps the React app; it is not an application backend.

This folder is intentionally empty for now. When a real backend is added, keep it
self-contained here (its own `package.json`, dependencies, and config) so the two
sides stay cleanly separated.

# syntax=docker/dockerfile:1

# Kailo storefront — TanStack Start behind Nitro's `node-server` preset, in two
# stages so the runtime carries neither the build toolchain nor node_modules.
#
# Node 22 throughout, matching the CMS image, the `engines` fields and the CI
# workflow. Pinning one major across the repo avoids a lockfile resolved under a
# Node nothing else runs.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Manifests first, so this layer survives source-only changes.
#
# `npm ci`, not `npm install`: the lockfile is load-bearing here. It is generated
# with npm 10 (the version Node 22 bundles, and the one this image therefore
# runs) because npm 11 prunes two optional peer deps npm 10 then rejects. See
# the README, "Two gotchas that only bite on a fresh checkout".
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The storefront's two modes are chosen by VITE_STRAPI_URL, and vite.config.ts
# inlines it into the bundle via `define` — so it is a *build* argument and
# cannot be an environment variable on the running container. Setting it at
# runtime does nothing at all.
#
# Empty is not a missing value: it is snapshot mode, where the site serves the
# committed CMS copy and needs no API. Pass a URL to build in live mode:
#
#   docker compose build --build-arg VITE_STRAPI_URL=https://cms.example.com
#
# Never bake in `http://localhost:1337` as a fallback — inside the container that
# address is the container itself, and every route would 500.
ARG VITE_STRAPI_URL=""
ENV VITE_STRAPI_URL=$VITE_STRAPI_URL

# Produces `.output`: a self-contained server bundle plus the static root. No
# .env, no database, no network — the same property CI relies on.
RUN npm run build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Node does not reap its children, and a PID 1 with no signal handler makes
# `docker compose stop` sit out the full 10s timeout on every restart.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

# `.output` is the entire application — Nitro bundles its dependencies, so there
# is deliberately no `npm ci --omit=dev` here and no node_modules in this image.
COPY --from=builder --chown=node:node /app/.output ./.output

USER node

# 8080, matching the dev server in vite.config.ts, so the CMS's CORS defaults
# cover both without a second origin.
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]

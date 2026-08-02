# syntax=docker/dockerfile:1

# Strapi 5 production image, in two stages so the runtime carries neither the
# compiler toolchain nor the dev dependencies.
#
# Node 22 throughout, matching .nvmrc, the `engines` field in package.json and
# the CI workflow. Pinning one major across the repo avoids a lockfile resolved
# under a Node nothing else runs.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# node-gyp needs these for the handful of native modules Strapi pulls in. They
# stay in this stage and never reach the runtime image. `sharp` is not among
# them — it resolves a prebuilt linux-musl binary.
RUN apk add --no-cache build-base python3

# Manifests first, so this layer survives source-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `strapi build` compiles src/ to dist/ and bundles the admin panel. It reads no
# .env and needs no database — the same property CI relies on, so this layer is
# safe to build on a machine that has neither.
#
# Pruning here rather than reinstalling in the runtime stage keeps the resolved
# tree byte-identical to the one just built against.
RUN npm run build && npm prune --omit=dev

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Strapi does not reap its children, and a PID 1 with no signal handler makes
# `docker compose stop` sit out the full 10s timeout on every single restart.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337

COPY --from=builder --chown=node:node /app ./

# public/uploads is a named volume in docker-compose.yml and the local upload
# provider writes into it as this user, so the mount point must be owned by it.
USER node

EXPOSE 1337

# `npm run seed` is NOT available in this image: the pruned tree has no tsx.
# Seeding happens in the bootstrap hook instead, gated on SEED_ON_BOOT — see
# src/index.ts. To reseed by hand, run it from a checkout on the host.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]

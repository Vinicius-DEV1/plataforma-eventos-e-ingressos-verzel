# Build context is the repository root (see docker-compose.yml): the monorepo
# uses npm workspaces and the lockfile lives there.

# ---------- Build stage ----------
FROM node:24-slim AS builder

WORKDIR /app

# Skips the `prepare` script, which installs Husky hooks: there is no Git
# repository inside the image.
ENV HUSKY=0

# Manifests first so the dependency layer is reused while they do not change.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY apps/api ./apps/api

# `npm run build` triggers `prebuild` (prisma generate) before tsc.
RUN npm run build --workspace @eventos/api

# ---------- Runtime stage ----------
FROM node:24-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# `--ignore-scripts` is required: the root `prepare` script calls Husky, which
# is a dev dependency and therefore absent from this install.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Compiled output only. The Prisma client comes along, since it is generated
# into src/generated and compiled into dist/.
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Schema ships with the image so migrations can run in production.
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/

# Unprivileged user, provided by the base image.
USER node

EXPOSE 3333

CMD ["node", "apps/api/dist/server.js"]

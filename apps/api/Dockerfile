# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /repo

# Enable corepack (pnpm)
RUN corepack enable

# Copy workspace manifests first (better caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

# Install deps for the whole workspace (cached)
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

COPY --from=deps /repo/node_modules /repo/node_modules
COPY . .

# Build shared then api
RUN pnpm -C packages/shared build
RUN pnpm -C apps/api build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Copy only runtime output + package.json (optional)
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json

# If you rely on runtime deps (fastify, openai), easiest is to copy node_modules
# (still fine for a demo). For smaller images, we'd do a production install.
COPY --from=deps /repo/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/server.js"]
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

COPY --from=deps /repo/node_modules /repo/node_modules
COPY . .

RUN pnpm -C packages/shared build
RUN pnpm -C apps/web build

# ---- serve (nginx) ----
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Replace default nginx config (optional)
# COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /repo/apps/web/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
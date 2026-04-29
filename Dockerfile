# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base

WORKDIR /app

ARG PNPM_VERSION=10.30.0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/admin/package.json ./apps/admin/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS source

COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend
COPY apps/admin ./apps/admin

# Avoid stale incremental metadata suppressing emits inside Docker builds.
RUN find /app -name '*.tsbuildinfo' -delete

FROM source AS build-backend

RUN cd apps/backend \
  && rm -rf dist \
  && rm -f tsconfig.tsbuildinfo tsconfig.build.tsbuildinfo
RUN cd apps/backend \
  && pnpm exec tsc -p tsconfig.build.json --incremental false \
  && test -f dist/main.js

FROM source AS build-frontend

ARG VITE_API_URL
ARG VITE_ADMIN_URL

RUN cd apps/frontend && VITE_API_URL=$VITE_API_URL VITE_ADMIN_URL=$VITE_ADMIN_URL pnpm build

FROM source AS build-admin

ARG VITE_API_URL
ARG VITE_WEB_URL

RUN cd apps/admin && VITE_API_URL=$VITE_API_URL VITE_WEB_URL=$VITE_WEB_URL pnpm build

FROM node:20-alpine AS backend-runtime

WORKDIR /app

COPY --from=build-backend /app /app

WORKDIR /app/apps/backend

EXPOSE 4000

CMD ["node", "dist/main.js"]

FROM caddy:2-alpine AS frontend-runtime

COPY apps/frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=build-frontend /app/apps/frontend/dist /srv

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

FROM caddy:2-alpine AS admin-runtime

COPY apps/admin/Caddyfile /etc/caddy/Caddyfile
COPY --from=build-admin /app/apps/admin/dist /srv

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

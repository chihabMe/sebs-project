FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_WEB_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEB_URL=$VITE_WEB_URL

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

RUN pnpm build --filter=@sebs/admin

FROM caddy:2-alpine

COPY apps/admin/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/admin/dist /srv

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

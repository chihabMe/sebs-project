FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN pnpm build --filter=@sebs/frontend

# --- Production runner stage ---
FROM nginx:alpine

# Copy built artifacts from builder to Nginx public folder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Optional: Copy a custom nginx configuration
# COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

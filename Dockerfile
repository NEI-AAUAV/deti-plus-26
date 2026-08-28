# Stage 1: build the static export
FROM node:22-alpine AS builder

WORKDIR /app

# corepack pins pnpm from package.json's "packageManager" field, so the image
# and CI always install with the same pnpm version.
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: serve the static files with Nginx
FROM nginx:alpine AS runner

# The export is built with basePath "/deti-plus-26" (GitHub Pages project
# site), so it must be served from that same subpath here or every asset 404s.
COPY --from=builder /app/out /usr/share/nginx/html/deti-plus-26
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

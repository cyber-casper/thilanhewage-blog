# syntax=docker/dockerfile:1

# ---- Build stage: install deps, build the Next.js app ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# git tracks files, not directories — an empty public/ dir doesn't survive a
# fresh clone, so COPY . . silently omits it and the runtime stage's
# COPY --from=build .../public would fail without this.
RUN mkdir -p public

# /digest, /digest/[date] (via generateStaticParams), and /rss.xml all query
# Notion during `next build` itself to prerender pages — so the read-only
# credentials must be available at build time, not just at container
# runtime. docker-compose.yml passes these through as build args.
ARG NOTION_API_KEY
ARG NOTION_DATABASE_ID
ARG NOTION_DATA_SOURCE_ID
ARG SITE_URL
ENV NOTION_API_KEY=$NOTION_API_KEY \
    NOTION_DATABASE_ID=$NOTION_DATABASE_ID \
    NOTION_DATA_SOURCE_ID=$NOTION_DATA_SOURCE_ID \
    SITE_URL=$SITE_URL

RUN npm run build

# ---- Runtime stage: only the standalone server output (see next.config.ts) ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Docker injects HOSTNAME=<container-id> into every container's environment,
# and Next's standalone server.js binds to *that* address instead of all
# interfaces when HOSTNAME is set — so every request 500s (or, from inside
# the container, connection-refuses) because the server is only listening on
# the container's internal bridge IP, never on localhost or the published
# port's target interface. Overriding it here is the documented fix (Next's
# own Docker example does the same) and takes precedence over Docker's
# auto-injected value since this ENV is set after the base image's default.
ENV HOSTNAME=0.0.0.0

RUN addgroup -S thilanhewage && adduser -S thilanhewage -G thilanhewage

# .next/standalone already contains a pruned node_modules with just the
# traced runtime dependencies — no `npm ci --omit=dev` step needed here, and
# no risk of a runtime-only package getting pruned along with devDeps.
COPY --from=build --chown=thilanhewage:thilanhewage /app/.next/standalone ./
COPY --from=build --chown=thilanhewage:thilanhewage /app/.next/static ./.next/static
COPY --from=build --chown=thilanhewage:thilanhewage /app/public ./public

USER thilanhewage

# Documentation only — no ports are published (see docker-compose.yml); the
# actual listening port is controlled by the PORT env var at runtime.
EXPOSE 3000

CMD ["node", "server.js"]

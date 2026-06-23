# Multi-stage build Dockerfile using Next.js "standalone" output - the
# runtime image only ever contains the pruned server bundle, never
# node_modules from a second install, and never dev dependencies.

# Stage 1: Build
FROM node:21-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:21-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user (Next.js recommended practice for the standalone
# image; node:alpine already provides a "node" user/group).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]

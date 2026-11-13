# Multi-stage Dockerfile for TutorPair Backend (ECS Fargate)
# Context must be repository root: docker build -t tutorpair-server -f Dockerfile .

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared ./packages/shared
COPY apps/client/package.json ./apps/client/package.json

# Copy backend app
COPY apps/server ./apps/server

# Install all workspace dependencies
RUN npm ci

# Build shared package first, then server
RUN npm run build --workspace=@tutorpair/shared
RUN npm run build --workspace=server

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Require the zlib release that fixes CVE-2026-4738 in the runtime image.
RUN apk add --no-cache 'zlib>=1.4-r0'

# RDS certificate trust for both the API and the one-off migration task.
RUN wget -q -O /app/rds-ap-southeast-1-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/ap-southeast-1/ap-southeast-1-bundle.pem \
  && test -s /app/rds-ap-southeast-1-bundle.pem

ENV NODE_ENV=production
ENV PORT=4000
ENV RDS_CA_BUNDLE=/app/rds-ap-southeast-1-bundle.pem

# Copy root package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/

# Install production dependencies for the API and its shared package.
RUN npm ci --omit=dev --workspace=server --workspace=@tutorpair/shared

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/src/db/migrations ./apps/server/dist/db/migrations

# The one-off ECS release task must override the image command with:
# node apps/server/dist/db/migrate.js
RUN test -f apps/server/dist/db/migrate.js \
  && test -f apps/server/dist/db/migrations/meta/_journal.json \
  && test -f apps/server/dist/db/migrations/0003_unique_review_recommendation.sql \
  && test -f apps/server/dist/db/migrations/0004_yummy_ender_wiggin.sql

# Expose backend port
EXPOSE 4000

# Container health check is process liveness. Configure the ALB target group to use
# /api/ready so database availability controls traffic readiness.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start server
CMD ["node", "apps/server/dist/server.js"]

# ============================================================
# ALhafez Center - Frontend Dockerfile (Next.js 16)
# ============================================================
# Multi-stage build for optimal image size
# ============================================================

# ---------- Stage 1: Install dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY front/package.json front/package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline


# ---------- Stage 2: Build the application ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source code
COPY front/ ./

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=http://backend:8001
ARG NEXT_PUBLIC_APP_NAME="صالة الحافظ للقطع الكهربائية"
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build Next.js
RUN npm run build


# ---------- Stage 3: Production runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the full build output and dependencies needed to run `next start`
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy next.config.ts (required for runtime)
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npx", "next", "start"]

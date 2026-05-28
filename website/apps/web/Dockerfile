# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copia ficheiros de dependências do monorepo
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

RUN npm ci --workspace=apps/web --include-workspace-root

# ── Stage 2: builder ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build (override no Coolify)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_COMING_SOON=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_COMING_SOON=$NEXT_PUBLIC_COMING_SOON

RUN npm run build --workspace=apps/web

# ── Stage 3: runner ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Utilizador não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

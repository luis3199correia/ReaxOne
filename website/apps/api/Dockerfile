# ── Stage 1: builder ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api --include-workspace-root

COPY apps/api ./apps/api

RUN npm run build --workspace=apps/api

# Gera Prisma Client
RUN cd apps/api && npx prisma generate

# ── Stage 2: runner ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copia apenas o necessário
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./

USER nestjs
EXPOSE 3001

# Corre migrações pendentes e arranca o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

# ── Stage 1: builder ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copia tudo (contexto é /website — raiz do monorepo)
COPY . .

# Instala todas as dependências do monorepo
RUN npm ci

# Build da API
RUN npm run build --workspace=apps/api

# Gera Prisma Client
RUN cd apps/api && npx prisma generate

# ── Stage 2: runner ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia node_modules e build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/main"]

FROM node:20-alpine
WORKDIR /app

COPY . .
RUN npm ci

# Gera o Prisma Client
RUN cd apps/api && npx prisma generate

# Build da API
WORKDIR /app/apps/api
RUN npx nest build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/main"]

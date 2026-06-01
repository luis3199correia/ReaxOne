FROM node:20-alpine
WORKDIR /app

# Copia monorepo completo
COPY . .

# Instala dependências
RUN npm ci

# Vai para a pasta da API e faz build diretamente
WORKDIR /app/apps/api
RUN npx nest build

# Gera Prisma Client
RUN npx prisma generate

# Verifica que o dist existe
RUN ls -la dist/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main"]

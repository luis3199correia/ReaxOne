FROM node:20-alpine
WORKDIR /app

# Copia monorepo completo
COPY . .

# Instala dependências
RUN npm ci

# Build da API (a partir da pasta da API)
RUN cd apps/api && ./node_modules/.bin/nest build || npx --prefix apps/api nest build || npx nest build --config apps/api/nest-cli.json

# Debug — confirma que o dist foi gerado
RUN find /app -name "main.js" -path "*/dist/*" 2>/dev/null && echo "--- dist found ---"

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["node", "dist/main"]

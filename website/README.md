# ReaxOne — Website

Monorepo com frontend Next.js e backend NestJS para a loja online ReaxOne.

## Estrutura

```
website/
├── apps/
│   ├── web/        # Frontend — Next.js 14 + Tailwind + next-intl
│   └── api/        # Backend — NestJS + Prisma + PostgreSQL
├── packages/
│   └── shared/     # Tipos partilhados
├── docker-compose.yml
└── package.json
```

## Pré-requisitos

- **Node.js** >= 20 — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — para a base de dados local

## Instalação

### 1. Clonar / abrir o projeto

```bash
cd website
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

**Backend:**
```bash
cp apps/api/.env.example apps/api/.env
```
Edita `apps/api/.env` e muda o `JWT_SECRET` para um valor secreto.

**Frontend:**
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

### 4. Iniciar a base de dados

```bash
docker-compose up -d
```
Isto inicia o PostgreSQL na porta **5432** e o pgAdmin em **http://localhost:5050**.

### 5. Criar as tabelas (migração)

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 6. Iniciar o projeto

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api
- **pgAdmin:** http://localhost:5050 (admin@reaxone.com / admin)

---

## Criar conta admin

Após o primeiro arranque, cria uma conta normal através do site e depois promove-a a admin diretamente na base de dados:

```bash
cd apps/api
npx prisma studio
```

No Prisma Studio, abre a tabela **User**, encontra o teu utilizador e muda o campo `role` de `CUSTOMER` para `ADMIN`. Guarda e faz login novamente — serás redirecionado para o backoffice em `/admin`.

---

## Rotas do site

| Rota | Descrição |
|------|-----------|
| `/pt` ou `/en` | Página inicial |
| `/pt/loja` | Loja |
| `/pt/loja/[slug]` | Página de produto |
| `/pt/carrinho` | Carrinho |
| `/pt/checkout` | Finalizar compra |
| `/pt/auth` | Login / Registo |
| `/pt/conta` | Área de cliente |
| `/pt/admin` | Backoffice (só ADMIN) |

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registar |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/users/me` | Perfil (auth) |
| GET | `/api/products` | Lista produtos |
| GET | `/api/products/:slug` | Produto por slug |
| POST | `/api/products` | Criar produto (admin) |
| POST | `/api/orders` | Criar encomenda |
| GET | `/api/orders/mine` | Encomendas do cliente (auth) |
| GET | `/api/orders` | Todas as encomendas (admin) |
| PATCH | `/api/orders/:id/confirm-payment` | Confirmar pagamento (admin) |
| GET | `/api/payments/details` | Dados de pagamento |
| POST | `/api/payments/settings` | Config pagamentos (admin) |

---

## Tecnologias

- **Frontend:** Next.js 14, Tailwind CSS, next-intl, Zustand, React Hook Form
- **Backend:** NestJS, Prisma, PostgreSQL, JWT (httpOnly cookies)
- **Monorepo:** npm workspaces + Turborepo
- **Idiomas:** Português (PT) e Inglês (EN)
- **Pagamentos:** MB Way e Transferência bancária (manual)

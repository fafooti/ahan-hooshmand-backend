# Digital Price Board — Backend API

REST API for the Digital Price Board system.

## Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

## Project Structure

```
src/
├── server.ts              # Entry point
├── app.ts                 # Express app setup
├── config/                # Environment & configuration
├── routes/                # Route definitions
├── controllers/           # Request handlers
├── services/              # Business logic
├── repositories/          # Data access layer
├── middlewares/           # Express middleware
├── prisma/
│   └── client.ts          # Prisma client singleton
├── utils/                 # Shared utilities
└── types/                 # TypeScript type definitions

prisma/
└── schema.prisma          # Database schema
```

## Getting Started

1. Copy `.env.example` to `.env` and configure your environment variables.
2. Ensure PostgreSQL is running and `DATABASE_URL` points to your database.
3. Install dependencies: `npm install`
4. Generate Prisma client: `npm run prisma:generate`
5. Run migrations: `npm run prisma:migrate` (development) or `npm run prisma:migrate:deploy` (production)
6. (Optional) Seed data: `npm run prisma:seed` — requires `SEED_ADMIN_PASSWORD` in `.env`
7. Start dev server: `npm run dev`

## Production Deployment

See `deploy/nginx.conf.example` and `ecosystem.config.cjs` for PM2 + Nginx setup on Ubuntu 22.04.

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations (development) |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Seed database (requires `SEED_ADMIN_PASSWORD`) |
| `npm run prisma:studio` | Open Prisma Studio |

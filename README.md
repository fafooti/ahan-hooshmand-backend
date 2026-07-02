# Digital Price Board — Backend API

REST API for the Digital Price Board system.

## Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- MySQL

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

1. Copy `.env.example` to `.env` and configure your database URL.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Start dev server: `npm run dev`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

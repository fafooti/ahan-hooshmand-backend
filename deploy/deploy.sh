#!/usr/bin/env bash
# Production deployment helper for Ubuntu 22.04 + Node.js 22 + PM2 + PostgreSQL
set -euo pipefail

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npm run prisma:generate

echo "==> Running database migrations"
npm run prisma:migrate:deploy

echo "==> Building TypeScript"
npm run build

echo "==> Deployment build complete"
echo "Start with: pm2 start ecosystem.config.cjs --env production"

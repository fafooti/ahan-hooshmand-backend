import dotenv from 'dotenv';

dotenv.config();

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  frontendUrl: process.env.FRONTEND_URL ?? '',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL),
} as const;

const DEV_CORS_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function resolveCorsOrigins(): string[] | boolean {
  if (config.nodeEnv === 'development') {
    const merged = [...new Set([...config.corsOrigins, ...DEV_CORS_ORIGINS])];
    return merged.length > 0 ? merged : true;
  }

  return config.corsOrigins.length > 0 ? config.corsOrigins : false;
}

export function getCorsOptions() {
  return {
    origin: resolveCorsOrigins(),
    credentials: true,
  };
}

export function validateProductionConfig(): void {
  if (config.nodeEnv !== 'production') {
    return;
  }

  const missing: string[] = [];

  if (!config.databaseUrl) {
    missing.push('DATABASE_URL');
  }

  if (!config.jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (config.corsOrigins.length === 0) {
    missing.push('CORS_ORIGIN or FRONTEND_URL');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

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

export function getCorsOptions() {
  const origins = config.corsOrigins;

  return {
    origin: origins.length > 0 ? origins : false,
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

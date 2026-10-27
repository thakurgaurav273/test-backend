export type NodeEnv = 'development' | 'production' | 'test';
export type SameSite = 'lax' | 'strict' | 'none';

export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  APP_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_HOURS: number;
  CORS_ORIGINS: string[];
  ADMIN_PANEL_URL: string;
  COOKIE_SAMESITE: SameSite;
  TRUST_PROXY: boolean | number | string;
  SWAGGER_ENABLED: boolean;
  UPLOAD_DIR: string;
  UPLOAD_MAX_SIZE_MB: number;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  MAIL_FROM: string;
  INQUIRY_NOTIFY_EMAIL?: string;
}

const str = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const int = (value: unknown, fallback: number, name: string): number => {
  const raw = str(value);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

const bool = (value: unknown, fallback: boolean): boolean => {
  const raw = str(value);
  return raw === undefined ? fallback : raw === 'true' || raw === '1';
};

const parseTrustProxy = (value: unknown): boolean | number | string => {
  const raw = str(value);
  if (raw === undefined || raw === 'false') return false;
  if (raw === 'true') return true;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
};

/** Validates process.env once at startup so misconfiguration fails fast. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const nodeEnv = (str(raw.NODE_ENV) ?? 'development') as NodeEnv;
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production or test');
  }

  const databaseUrl = str(raw.DATABASE_URL);
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const jwtSecret = str(raw.JWT_SECRET);
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is required and must be at least 32 characters',
    );
  }

  const sameSite = (str(raw.COOKIE_SAMESITE) ?? 'lax') as SameSite;
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAMESITE must be lax, strict or none');
  }

  const port = int(raw.PORT, 4000, 'PORT');
  const corsOrigins = (str(raw.CORS_ORIGINS) ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    APP_URL: (str(raw.APP_URL) ?? `http://localhost:${port}`).replace(
      /\/+$/,
      '',
    ),
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_HOURS: int(
      raw.JWT_EXPIRES_IN_HOURS,
      24,
      'JWT_EXPIRES_IN_HOURS',
    ),
    CORS_ORIGINS: corsOrigins,
    ADMIN_PANEL_URL: (
      str(raw.ADMIN_PANEL_URL) ??
      corsOrigins[0] ??
      'http://localhost:3000'
    ).replace(/\/+$/, ''),
    COOKIE_SAMESITE: sameSite,
    TRUST_PROXY: parseTrustProxy(raw.TRUST_PROXY),
    SWAGGER_ENABLED: bool(raw.SWAGGER_ENABLED, nodeEnv !== 'production'),
    UPLOAD_DIR: str(raw.UPLOAD_DIR) ?? 'uploads',
    UPLOAD_MAX_SIZE_MB: int(raw.UPLOAD_MAX_SIZE_MB, 5, 'UPLOAD_MAX_SIZE_MB'),
    CLOUDINARY_CLOUD_NAME: str(raw.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: str(raw.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: str(raw.CLOUDINARY_API_SECRET),
    SMTP_HOST: str(raw.SMTP_HOST),
    SMTP_PORT: int(raw.SMTP_PORT, 587, 'SMTP_PORT'),
    SMTP_SECURE: bool(raw.SMTP_SECURE, false),
    SMTP_USER: str(raw.SMTP_USER),
    SMTP_PASS: str(raw.SMTP_PASS),
    MAIL_FROM: str(raw.MAIL_FROM) ?? 'ZoyCoders <no-reply@zoycoders.com>',
    INQUIRY_NOTIFY_EMAIL: str(raw.INQUIRY_NOTIFY_EMAIL),
  };
}

/** Origins allowed to call the API from a browser (CORS) and to send cookie-authenticated writes. */
export function trustedOrigins(
  env: Pick<Env, 'CORS_ORIGINS' | 'APP_URL'>,
): string[] {
  return [...new Set([...env.CORS_ORIGINS, new URL(env.APP_URL).origin])];
}

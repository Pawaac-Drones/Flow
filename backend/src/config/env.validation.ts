import * as Joi from 'joi';

/**
 * Validates all process.env variables consumed by the backend at bootstrap.
 * Fails fast with a descriptive error if required variables are missing or
 * malformed, instead of surfacing confusing runtime errors later (e.g. a
 * TypeORM connection failure with no indication of *why*).
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('pawaacflow'),
  DB_PASSWORD: Joi.string().allow('').default('pawaacflow_secret'),
  DB_DATABASE: Joi.string().default('pawaacflow'),
  // Enable TLS for managed/hosted Postgres providers (Supabase, RDS, etc).
  DB_SSL: Joi.boolean().default(false),
  // Skip CA verification (needed for providers using self-signed certs,
  // e.g. Supabase's pooler). Only takes effect when DB_SSL=true.
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  DB_POOL_SIZE: Joi.number().integer().min(1).default(10),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // OpenWA
  OPENWA_ENABLED: Joi.boolean().default(false),
  OPENWA_API_URL: Joi.string().uri().default('http://openwa:8080'),
  OPENWA_API_KEY: Joi.string().allow('').default(''),
  OPENWA_WEBHOOK_SECRET: Joi.string().allow('').default(''),

  // LLM
  LLM_PROVIDER: Joi.string().default('openai'),
  LLM_API_KEY: Joi.string().allow('').default(''),
  LLM_MODEL: Joi.string().default('gpt-4o-mini'),
  LLM_BASE_URL: Joi.string().uri().default('https://api.openai.com/v1'),

  // SMTP
  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().default('PawaacFlow <noreply@pawaacflow.local>'),
}).unknown(true); // allow other env vars (PATH, etc.) to pass through
